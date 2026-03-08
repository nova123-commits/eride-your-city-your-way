import { useAuth } from "@/hooks/useAuth";
import { NavLink } from "@/components/NavLink";
import {
  MapPin, History, User, Wallet, Wrench, Car, Shield, Users, FileText, BarChart3, LogOut,
} from "lucide-react";

const riderLinks = [
  { to: "/rider", label: "My Trips", icon: MapPin },
  { to: "/gold", label: "Profile", icon: User },
];

const driverLinks = [
  { to: "/driver", label: "Dashboard", icon: Car },
  { to: "/wallet", label: "Earnings", icon: Wallet },
  { to: "/onboarding", label: "Vehicle", icon: Wrench },
];

const adminLinks = [
  { to: "/admin/overview", label: "Overview", icon: BarChart3 },
  { to: "/admin/approvals", label: "Approvals", icon: Shield },
  { to: "/admin/tax", label: "Tax Report", icon: FileText },
];

export default function RoleNav() {
  const { role, signOut } = useAuth();

  const links =
    role === "admin" ? adminLinks :
    role === "driver" ? driverLinks :
    riderLinks;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-bottom-sheet safe-bottom">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-muted-foreground transition-colors"
            activeClassName="text-primary"
          >
            <link.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{link.label}</span>
          </NavLink>
        ))}
        <button
          onClick={signOut}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
}
