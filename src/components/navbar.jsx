import { motion as Motion } from 'framer-motion';
import { Link } from "react-router-dom";
import { useEffect, useState } from 'react';
import MainLogo from "../assets/img/TmVrLogo.png";
import { BiMenu, BiX } from 'react-icons/bi';

const navItems = [
  { label: 'VR Tours', href: '/vr-tours' },
  { label: 'Book Safari', href: '/book-safari' },
  { label: 'Our Services', href: '/services' },
  { label: 'About Us', href: '/about' },
];

const Navbar = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Motion.nav
      initial={{ opacity: 0, y: -30 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-4 left-1/2 z-50 w-[90%] max-w-7xl -translate-x-1/2 rounded-2xl border border-primary bg-black/95 px-6 py-4 shadow-lg backdrop-blur-md"
    >
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1 text-white font-semibold text-xl">
          <img src={MainLogo} alt="TravelMateVr" className="w-20 h-auto" />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex gap-8 items-center text-sm font-medium">
          {navItems.map((item) => (
            <Link key={item.label} to={item.href} className="text-primary hover:text-white transition">
              {item.label}
            </Link>
          ))}
          <Link
            to="/signin"
            className="text-primary hover:text-white transition font-semibold"
          >
            Sign in
          </Link>
        </div>

        {/* Mobile hamburger menu */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-primary hover:text-white transition"
        >
          {menuOpen ? <BiX size={24} /> : <BiMenu size={24} />}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="mt-4 flex flex-col gap-4 md:hidden text-sm font-medium text-primary">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              onClick={() => setMenuOpen(false)}
              className="hover:text-white transition"
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/signin"
            onClick={() => setMenuOpen(false)}
            className="hover:text-white transition font-semibold"
          >
            Sign in
          </Link>
        </div>
      )}
    </Motion.nav>
  );
};

export default Navbar;
