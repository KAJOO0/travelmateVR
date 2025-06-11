import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import BackgroundCircles from "../components/background";

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen flex flex-col bg-gray-100 overflow-x-hidden z-0">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <BackgroundCircles />
      </div>

      {/* Navbar */}
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main content */}
      <main className="flex-grow w-full overflow-x-hidden z-10 relative">
        <div className="w-[90%] max-w-7xl mx-auto py-10 text-white">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MainLayout;
