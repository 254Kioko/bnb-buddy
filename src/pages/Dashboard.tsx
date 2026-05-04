import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const [stats, setStats] = useState({ rooms: 0, bookings: 0, income: 0, expenses: 0 });

  useEffect(() => {
    (async () => {
      const [rooms, bookings, income, expenses] = await Promise.all([
        supabase.from("rooms").select("id", { count: "exact", head: true }),
        supabase.from("bookings").select("id", { count: "exact", head: true }),
        supabase.from("income").select("amount"),
        supabase.from("expenses").select("amount"),
      ]);
      const sum = (rows: any[] | null) =>
        (rows ?? []).reduce((a, r) => a + Number(r.amount || 0), 0);
      setStats({
        rooms: rooms.count ?? 0,
        bookings: bookings.count ?? 0,
        income: sum(income.data),
        expenses: sum(expenses.data),
      });
    })();
  }, []);

  const profit = stats.income - stats.expenses;

  const cards = [
    { label: "Rooms", value: stats.rooms },
    { label: "Bookings", value: stats.bookings },
    { label: "Income", value: `$${stats.income.toFixed(2)}` },
    { label: "Expenses", value: `$${stats.expenses.toFixed(2)}` },
    { label: "Profit / Loss", value: `$${profit.toFixed(2)}` },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">
                {c.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
