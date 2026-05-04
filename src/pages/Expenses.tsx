import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface Expense {
  id: string; category: string; amount: number;
  description: string | null; expense_date: string;
}

const CATS = ["Rent", "Water", "Electricity", "Maintenance", "Supplies", "Other"];

export default function Expenses() {
  const { user } = useAuth();
  const [list, setList] = useState<Expense[]>([]);
  const [form, setForm] = useState({
    category: "Other", amount: "", description: "",
    expense_date: new Date().toISOString().slice(0, 10),
  });

  const load = async () => {
    const { data, error } = await supabase.from("expenses").select("*")
      .order("expense_date", { ascending: false });
    if (error) toast.error(error.message); else setList(data as Expense[]);
  };

  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("expenses").insert({
      user_id: user.id,
      category: form.category,
      amount: Number(form.amount),
      description: form.description || null,
      expense_date: form.expense_date,
    });
    if (error) return toast.error(error.message);
    toast.success("Expense added");
    setForm({ category: "Other", amount: "", description: "",
      expense_date: new Date().toISOString().slice(0, 10) });
    load();
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Expenses</h1>
      <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div className="space-y-1">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Amount</Label>
          <Input type="number" min="0" step="0.01" value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
        </div>
        <div className="space-y-1">
          <Label>Date</Label>
          <Input type="date" value={form.expense_date}
            onChange={(e) => setForm({ ...form, expense_date: e.target.value })} required />
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label>Description</Label>
          <Input value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <Button type="submit" className="md:col-span-5">Add expense</Button>
      </form>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((x) => (
              <TableRow key={x.id}>
                <TableCell>{x.expense_date}</TableCell>
                <TableCell>{x.category}</TableCell>
                <TableCell>${Number(x.amount).toFixed(2)}</TableCell>
                <TableCell>{x.description}</TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" onClick={() => del(x.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {list.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                  No expenses yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
