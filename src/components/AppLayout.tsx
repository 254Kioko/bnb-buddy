import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Home, BedDouble, CalendarRange, Wallet, TrendingUp, LogOut } from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/rooms", label: "Rooms", icon: BedDouble },
  { to: "/bookings", label: "Bookings", icon: CalendarRange },
  { to: "/expenses", label: "Expenses", icon: Wallet },
  { to: "/income", label: "Income", icon: TrendingUp },
];

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const username = user?.email?.split("@")[0] ?? "";

  return (
    <div className="min-h-screen flex flex-col md:flex-row w-full bg-background">
      <aside className="md:w-60 md:min-h-screen border-b md:border-b-0 md:border-r bg-card">
        <div className="p-4 border-b">
          <h1 className="font-semibold text-lg">BnB Manager</h1>
          <p className="text-xs text-muted-foreground">@{username}</p>
        </div>
        <nav className="p-2 flex md:flex-col gap-1 overflow-x-auto">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-md text-sm whitespace-nowrap ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 md:absolute md:bottom-2 md:w-60">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={async () => {
              await signOut();
              nav("/login");
            }}
          >
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}
