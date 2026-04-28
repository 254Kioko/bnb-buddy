import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase, type Booking, type Room } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

const schema = z.object({
  room_id: z.string().uuid("Select a room"),
  client_name: z.string().trim().min(1, "Client name required").max(100),
  check_in_date: z.string().min(1),
  check_out_date: z.string().min(1),
  payment_status: z.enum(["paid", "unpaid", "partial"]),
}).refine((v) => new Date(v.check_out_date) > new Date(v.check_in_date), {
  message: "Check-out must be after check-in",
  path: ["check_out_date"],
});

const nightsBetween = (a: string, b: string) => {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
};

export default function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [form, setForm] = useState({
    room_id: "",
    client_name: "",
    check_in_date: "",
    check_out_date: "",
    payment_status: "unpaid" as "paid" | "unpaid" | "partial",
  });

  const load = async () => {
    setLoading(true);
    const [{ data: b, error: be }, { data: r, error: re }] = await Promise.all([
      supabase.from("bookings").select("*").order("check_in_date", { ascending: false }),
      supabase.from("rooms").select("*").order("name"),
    ]);
    if (be || re) toast.error("Failed to load");
    setBookings((b ?? []) as Booking[]);
    setRooms((r ?? []) as Room[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const roomMap = useMemo(() => Object.fromEntries(rooms.map((r) => [r.id, r])), [rooms]);

  const openNew = () => {
    setEditing(null);
    setForm({ room_id: rooms[0]?.id ?? "", client_name: "", check_in_date: "", check_out_date: "", payment_status: "unpaid" });
    setOpen(true);
  };
  const openEdit = (b: Booking) => {
    setEditing(b);
    setForm({
      room_id: b.room_id,
      client_name: b.client_name,
      check_in_date: b.check_in_date,
      check_out_date: b.check_out_date,
      payment_status: b.payment_status,
    });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    const room = roomMap[parsed.data.room_id];
    if (!room) return toast.error("Room not found");

    const nights = nightsBetween(parsed.data.check_in_date, parsed.data.check_out_date);
    if (nights <= 0) return toast.error("Stay must be at least 1 night");
    const total_amount = Number((nights * Number(room.price_per_night)).toFixed(2));

    const payload = { ...parsed.data, total_amount };

    if (editing) {
      const { error } = await supabase.from("bookings").update(payload).eq("id", editing.id);
      if (error) return toast.error("Failed to update");
      toast.success("Booking updated");
    } else {
      const { error } = await supabase.from("bookings").insert({ ...payload, user_id: user.id });
      if (error) return toast.error("Failed to create");
      toast.success("Booking created");
    }
    setOpen(false);
    load();
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this booking?")) return;
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) return toast.error("Failed to delete");
    toast.success("Booking deleted");
    load();
  };

  const statusVariant = (s: Booking["payment_status"]) =>
    s === "paid" ? "default" : s === "partial" ? "secondary" : "destructive";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
          <p className="text-sm text-muted-foreground">Track stays and payments</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} disabled={rooms.length === 0}>
              <Plus className="mr-2 h-4 w-4" />New booking
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit booking" : "New booking"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Room</Label>
                <Select value={form.room_id} onValueChange={(v) => setForm({ ...form, room_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select a room" /></SelectTrigger>
                  <SelectContent>
                    {rooms.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name} — ${Number(r.price_per_night).toFixed(2)}/night</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Client name</Label>
                <Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Check-in</Label>
                  <Input type="date" value={form.check_in_date} onChange={(e) => setForm({ ...form, check_in_date: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Check-out</Label>
                  <Input type="date" value={form.check_out_date} onChange={(e) => setForm({ ...form, check_out_date: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Payment status</Label>
                <Select value={form.payment_status} onValueChange={(v) => setForm({ ...form, payment_status: v as "paid" | "unpaid" | "partial" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.room_id && form.check_in_date && form.check_out_date && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <span className="text-muted-foreground">Total: </span>
                  <span className="font-semibold">
                    ${(nightsBetween(form.check_in_date, form.check_out_date) * Number(roomMap[form.room_id]?.price_per_night ?? 0)).toFixed(2)}
                  </span>
                  <span className="text-muted-foreground"> ({nightsBetween(form.check_in_date, form.check_out_date)} nights)</span>
                </div>
              )}
              <DialogFooter>
                <Button type="submit">{editing ? "Save" : "Create"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        {loading ? (
          <p className="p-6 text-muted-foreground">Loading…</p>
        ) : bookings.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">No bookings yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id} className={b.payment_status === "unpaid" ? "bg-destructive/5" : ""}>
                  <TableCell className="font-medium">{b.client_name}</TableCell>
                  <TableCell>{roomMap[b.room_id]?.name ?? "—"}</TableCell>
                  <TableCell>{b.check_in_date}</TableCell>
                  <TableCell>{b.check_out_date}</TableCell>
                  <TableCell>${Number(b.total_amount).toFixed(2)}</TableCell>
                  <TableCell><Badge variant={statusVariant(b.payment_status)}>{b.payment_status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(b.id)}><Trash2 className="h-4 w-4" /></Button>
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
