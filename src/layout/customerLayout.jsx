import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { CalendarCheck, History, UserRound, LogOut, Menu, X } from "lucide-react";
import { logout } from "../utils/auth";

const navItems = [
  { label: "My Bookings", to: "/dashboard", icon: CalendarCheck, end: true },
  { label: "Tour History", to: "/dashboard/history", icon: History },
  { label: "Profile", to: "/dashboard/profile", icon: UserRound },
];

const CustomerLayout = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/signIn");
    setMenuOpen(false);
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
      isActive ? "bg-primary/20 text-primary" : "text-mutedText/70 hover:bg-primary/10 hover:text-white"
    }`;

  return (
    <div className="min-h-screen bg-background text-titlecolor">
      <header className="border-b border-primary/20 bg-secondary/60 px-6 py-5 md:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-xl font-semibold text-primary">TravelMate</span>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map(({ label, to, icon: Icon, end }) => (
              <NavLink key={label} to={to} end={end} className={linkClass}>
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-mutedText/70 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut size={16} />
              Logout
            </button>
          </nav>

          <button onClick={() => setMenuOpen((v) => !v)} className="text-mutedText/70 hover:text-white md:hidden">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <nav className="mx-auto mt-4 flex max-w-5xl flex-col gap-1 md:hidden">
            {navItems.map(({ label, to, icon: Icon, end }) => (
              <NavLink key={label} to={to} end={end} className={linkClass} onClick={() => setMenuOpen(false)}>
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-mutedText/70 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut size={16} />
              Logout
            </button>
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8 md:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default CustomerLayout;
