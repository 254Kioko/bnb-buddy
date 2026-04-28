import { useEffect, useMemo, useState } from "react";
import { DollarSign, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { supabase, type Booking, type Expense } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type Range = "week" | "month";

const startOfRange = (range: Range) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (range === "week") d.setDate(d.getDate() - 7);
  else d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
};

export default function Dashboard() {
  const [range, setRange] = useState<Range>("month");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const since = startOfRange(range);
      // RLS guarantees user-scoped data. Range filter on date columns.
      const [{ data: b, error: be }, { data: e, error: ee }] = await Promise.all([
        supabase.from("bookings").select("*").gte("check_in_date", since),
        supabase.from("expenses").select("*").gte("date", since),
      ]);
      if (be || ee) toast.error("Failed to load metrics");
      setBookings((b ?? []) as Booking[]);
      setExpenses((e ?? []) as Expense[]);
      setLoading(false);
    };
    load();
  }, [range]);

  const income = useMemo(
    () => bookings.filter((b) => b.payment_status === "paid").reduce((s, b) => s + Number(b.total_amount), 0),
    [bookings]
  );
  const totalExpenses = useMemo(
    () => expenses.reduce((s, e) => s + Number(e.amount), 0),
    [expenses]
  );
  const profit = income - totalExpenses;
  const unpaid = useMemo(
    () => bookings.filter((b) => b.payment_status !== "paid").reduce((s, b) => s + Number(b.total_amount), 0),
    [bookings]
  );

  const cards = [
    { label: "Income (paid)", value: income, icon: DollarSign, tone: "text-success" },
    { label: "Expenses", value: totalExpenses, icon: TrendingDown, tone: "text-destructive" },
    { label: profit >= 0 ? "Profit" : "Loss", value: profit, icon: TrendingUp, tone: profit >= 0 ? "text-success" : "text-destructive" },
    { label: "Unpaid bookings", value: unpaid, icon: Wallet, tone: "text-warning" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your performance at a glance</p>
        </div>
        <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
          <TabsList>
            <TabsTrigger value="week">Last 7 days</TabsTrigger>
            <TabsTrigger value="month">Last 30 days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <c.icon className={`h-4 w-4 ${c.tone}`} />
            </div>
            <p className="mt-2 text-2xl font-bold">
              {loading ? "…" : `$${c.value.toFixed(2)}`}
            </p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="font-semibold">Summary</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Showing {range === "week" ? "the last 7 days" : "the last 30 days"}. Income is calculated from
          bookings marked as <span className="font-medium text-foreground">paid</span>. All metrics are
          scoped to your account by row-level security.
        </p>
      </Card>
    </div>
  );
}
