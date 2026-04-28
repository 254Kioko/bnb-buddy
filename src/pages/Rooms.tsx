import { useEffect, useState } from "react";
import { z } from "zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase, type Room } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().trim().min(1, "Name required").max(100),
  price_per_night: z.number().positive("Price must be > 0").max(1_000_000),
  status: z.enum(["available", "occupied"]),
});

export default function Rooms() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState({ name: "", price: "", status: "available" as "available" | "occupied" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("rooms").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Failed to load rooms");
    else setRooms((data ?? []) as Room[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", price: "", status: "available" });
    setOpen(true);
  };
  const openEdit = (r: Room) => {
    setEditing(r);
    setForm({ name: r.name, price: String(r.price_per_night), status: r.status });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({
      name: form.name,
      price_per_night: Number(form.price),
      status: form.status,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }

    if (editing) {
      const { error } = await supabase.from("rooms").update(parsed.data).eq("id", editing.id);
      if (error) return toast.error("Failed to update");
      toast.success("Room updated");
    } else {
      const { error } = await supabase.from("rooms").insert({ ...parsed.data, user_id: user.id });
      if (error) return toast.error("Failed to create");
      toast.success("Room created");
    }
    setOpen(false);
    load();
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this room?")) return;
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (error) return toast.error("Failed to delete");
    toast.success("Room deleted");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rooms</h1>
          <p className="text-sm text-muted-foreground">Manage your rooms and pricing</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />New room</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit room" : "New room"}</DialogTitle>
              <DialogDescription>Set name, nightly price and status.</DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Price per night</Label>
                <Input type="number" min="0.01" step="0.01" value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "available" | "occupied" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit">{editing ? "Save" : "Create"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : rooms.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">No rooms yet. Create your first one.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{r.name}</h3>
                  <p className="mt-1 text-2xl font-bold">${Number(r.price_per_night).toFixed(2)}<span className="text-sm font-normal text-muted-foreground">/night</span></p>
                </div>
                <Badge variant={r.status === "available" ? "default" : "secondary"}>{r.status}</Badge>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(r)}><Pencil className="mr-1 h-3 w-3" />Edit</Button>
                <Button size="sm" variant="outline" onClick={() => onDelete(r.id)}><Trash2 className="mr-1 h-3 w-3" />Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
