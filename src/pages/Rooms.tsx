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

interface Room {
  id: string;
  name: string;
  price_per_night: number;
  status: string;
  notes: string | null;
}

export default function Rooms() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("available");

  const load = async () => {
    const { data, error } = await supabase
      .from("rooms").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRooms(data as Room[]);
  };

  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("rooms").insert({
      user_id: user.id,
      name,
      price_per_night: Number(price),
      status,
    });
    if (error) return toast.error(error.message);
    setName(""); setPrice(""); setStatus("available");
    toast.success("Room added");
    load();
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Rooms</h1>
      <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div className="space-y-1">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Price / night</Label>
          <Input type="number" min="0" step="0.01" value={price}
            onChange={(e) => setPrice(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit">Add room</Button>
      </form>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.name}</TableCell>
                <TableCell>${Number(r.price_per_night).toFixed(2)}</TableCell>
                <TableCell className="capitalize">{r.status}</TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" onClick={() => del(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rooms.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                  No rooms yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
