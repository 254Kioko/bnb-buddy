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

interface Room { id: string; name: string }
interface Booking {
  id: string; guest_name: string; check_in: string; check_out: string;
  total_amount: number; payment_status: string; room_id: string | null;
  rooms?: { name: string } | null;
}

export default function Bookings() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [list, setList] = useState<Booking[]>([]);
  const [form, setForm] = useState({
    room_id: "", guest_name: "", check_in: "", check_out: "",
    total_amount: "", payment_status: "unpaid",
  });

  const load = async () => {
    const [rRes, bRes] = await Promise.all([
      supabase.from("rooms").select("id,name").order("name"),
      supabase.from("bookings").select("*, rooms(name)").order("created_at", { ascending: false }),
    ]);
    if (rRes.error) toast.error(rRes.error.message); else setRooms(rRes.data as Room[]);
    if (bRes.error) toast.error(bRes.error.message); else setList(bRes.data as Booking[]);
  };

  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      room_id: form.room_id || null,
      guest_name: form.guest_name,
      check_in: form.check_in,
      check_out: form.check_out,
      total_amount: Number(form.total_amount || 0),
      payment_status: form.payment_status,
    });
    if (error) return toast.error(error.message);
    toast.success("Booking added");
    setForm({ room_id: "", guest_name: "", check_in: "", check_out: "", total_amount: "", payment_status: "unpaid" });
    load();
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Bookings</h1>
      <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        <div className="space-y-1 md:col-span-2">
          <Label>Guest</Label>
          <Input value={form.guest_name}
            onChange={(e) => setForm({ ...form, guest_name: e.target.value })} required />
        </div>
        <div className="space-y-1">
          <Label>Room</Label>
          <Select value={form.room_id} onValueChange={(v) => setForm({ ...form, room_id: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {rooms.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Check-in</Label>
          <Input type="date" value={form.check_in}
            onChange={(e) => setForm({ ...form, check_in: e.target.value })} required />
        </div>
        <div className="space-y-1">
          <Label>Check-out</Label>
          <Input type="date" value={form.check_out}
            onChange={(e) => setForm({ ...form, check_out: e.target.value })} required />
        </div>
        <div className="space-y-1">
          <Label>Total</Label>
          <Input type="number" min="0" step="0.01" value={form.total_amount}
            onChange={(e) => setForm({ ...form, total_amount: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Payment</Label>
          <Select value={form.payment_status}
            onValueChange={(v) => setForm({ ...form, payment_status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="md:col-span-6">Add booking</Button>
      </form>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((b) => (
              <TableRow key={b.id} className={b.payment_status === "unpaid" ? "bg-destructive/5" : ""}>
                <TableCell>{b.guest_name}</TableCell>
                <TableCell>{b.rooms?.name ?? "—"}</TableCell>
                <TableCell>{b.check_in}</TableCell>
                <TableCell>{b.check_out}</TableCell>
                <TableCell>${Number(b.total_amount).toFixed(2)}</TableCell>
                <TableCell className="capitalize">{b.payment_status}</TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" onClick={() => del(b.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {list.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                  No bookings yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
