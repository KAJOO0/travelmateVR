import { motion as Motion } from 'framer-motion';
import { Link } from "react-router-dom";
import { useEffect, useState } from 'react';
import MainLogo from "../assets/img/TmVrLogo.png";

const navItems = [
  { label: 'VR Tours', href: '/vr-tours' },
  { label: 'Book Safari', href: '/book-safari' },
  { label: 'Our Services', href: '/services' },
  { label: 'About Us', href: '/about' },
];

const Navbar = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show navbar on mount with delay
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
        <Link href="/" className="flex items-center gap-1 text-white font-semibold text-xl">
         <img src={MainLogo} alt="TravelMateVr" className="w-20 h-auto" />
        </Link>

        {/* Navigation links */}
        <div className="flex gap-8 items-center text-sm font-medium">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="text-primary hover:text-white transition">
              {item.label}
            </Link>
          ))}
        </div>

        {/* Sign in button */}
        <Link
          href="/signin"
          className="text-primary hover:text-white transition font-semibold"
        >
          Sign in
        </Link>
      </div>
    </Motion.nav>
  );
}
export default Navbar;