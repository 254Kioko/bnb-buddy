import { useEffect, useState } from "react";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { supabase, type Expense } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const CATEGORIES = ["rent", "water", "electricity", "maintenance", "other"] as const;
const LABELS: Record<typeof CATEGORIES[number], string> = {
  rent: "Rent",
  water: "Water Bill",
  electricity: "Electricity",
  maintenance: "Maintenance",
  other: "Other",
};

const schema = z.object({
  amount: z.number().positive("Amount must be > 0").max(10_000_000),
  category: z.enum(CATEGORIES),
  description: z.string().trim().max(500).optional(),
  date: z.string().min(1, "Date required"),
});

export default function Expenses() {
  const { user } = useAuth();
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    category: "other" as typeof CATEGORIES[number],
    description: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("expenses").select("*").order("date", { ascending: false });
    if (error) toast.error("Failed to load expenses");
    else setItems((data ?? []) as Expense[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setForm({ amount: "", category: "other", description: "", date: new Date().toISOString().slice(0, 10) });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({
      amount: Number(form.amount),
      category: form.category,
      description: form.description || undefined,
      date: form.date,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    const { error } = await supabase.from("expenses").insert({
      ...parsed.data,
      description: parsed.data.description ?? null,
      user_id: user.id,
    });
    if (error) return toast.error("Failed to add");
    toast.success("Expense added");
    setOpen(false);
    load();
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) return toast.error("Failed to delete");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground">Track operating costs</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />New expense</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New expense</DialogTitle></DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" min="0.01" step="0.01" value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as typeof CATEGORIES[number] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{LABELS[c]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} />
              </div>
              <DialogFooter><Button type="submit">Add</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        {loading ? (
          <p className="p-6 text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">No expenses yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.date}</TableCell>
                  <TableCell><Badge variant="secondary">{LABELS[e.category]}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{e.description || "—"}</TableCell>
                  <TableCell className="text-right font-medium">${Number(e.amount).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => onDelete(e.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
