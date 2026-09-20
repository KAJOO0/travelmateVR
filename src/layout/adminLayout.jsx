import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, CalendarCheck, MapPinned, FileText, Image, LogOut, Menu, X } from "lucide-react";
import { logout } from "../utils/auth";

const navItems = [
  { label: "Overview", to: "/admin", icon: LayoutDashboard, end: true },
  { label: "Bookings", to: "/admin/bookings", icon: CalendarCheck },
  { label: "Tours", to: "/admin/tours", icon: MapPinned },
  { label: "Content", to: "/admin/content", icon: FileText },
  { label: "Site Content", to: "/admin/site-content", icon: Image },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/signIn");
  };

  return (
    <div className="min-h-screen bg-background text-titlecolor md:flex">
      <header className="flex items-center justify-between border-b border-primary/20 bg-secondary/60 p-4 md:hidden">
        <span className="text-lg font-semibold text-primary">TravelMate Admin</span>
        <button onClick={() => setMobileOpen(true)} className="text-mutedText/70 hover:text-white">
          <Menu size={22} />
        </button>
      </header>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-primary/20 bg-secondary/95 p-6 transition-transform duration-200 md:static md:z-auto md:translate-x-0 md:bg-secondary/60 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-10 flex items-center justify-between">
          <span className="text-xl font-semibold text-primary">TravelMate Admin</span>
          <button onClick={() => setMobileOpen(false)} className="text-mutedText/70 hover:text-white md:hidden">
            <X size={20} />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={label}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  isActive ? "bg-primary/20 text-primary" : "text-mutedText/70 hover:bg-primary/10 hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-mutedText/70 hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <main className="flex-1 overflow-x-hidden p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
