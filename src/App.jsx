import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ScrollToTop from "./components/ScrollToTop";
import AdminLayout from "./layout/adminLayout";
import CustomerLayout from "./layout/customerLayout";
import Login from "./pages/login";
import ProtectedRoute from "./components/ProtectedRoute";
import { AdminDataProvider } from "./context/AdminDataContext";
import AdminOverview from "./pages/admin/overview";
import AdminBookings from "./pages/admin/bookings";
import AdminTours from "./pages/admin/tours";
import AdminContent from "./pages/admin/content";
import { CustomerDataProvider } from "./context/CustomerDataContext";
import CustomerBookings from "./pages/customer/bookings";
import TourHistory from "./pages/customer/history";
import Profile from "./pages/customer/profile";
import { SiteContentProvider } from "./context/SiteContentContext";
import AdminSiteContent from "./pages/admin/siteContent";

const MainLayout = lazy(() => import("./layout/mainLayout"));
const Home = lazy(() => import("./pages/home"));
const About = lazy(() => import("./pages/about"));
const Contact = lazy(() => import("./pages/contact"));
const Tours = lazy(() => import("./pages/tours"));
const Blog = lazy(() => import("./pages/blog"));
const Services = lazy(() => import("./pages/services"));
const Cultural = lazy(() => import("./pages/cultural"));
const Landscape = lazy(() => import("./pages/landscape"));
const Wildlife = lazy(() => import("./pages/wildlife"));
const FAQS = lazy(() => import("./pages/faqs"));

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Toaster position="top-right" />
      <SiteContentProvider>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="vr-tours" element={<Tours />} />
              <Route path="contact" element={<Contact />} />
              <Route path="book-safari" element={<Tours />} />
              <Route path="services" element={<Services />} />
              <Route path="termsandconditions" element={<Tours />} />
              <Route path="privacypolicy" element={<Tours />} />
              <Route path="blog" element={<Blog />} />
              <Route path="faqs" element={<FAQS />} />
              <Route path="cultural-heritage" element={<Cultural />} />
              <Route path="landscape" element={<Landscape />} />
              <Route path="wild-animals" element={<Wildlife />} />
            </Route>
            <Route path="/signIn" element={<Login />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminDataProvider>
                    <AdminLayout />
                  </AdminDataProvider>
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminOverview />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="tours" element={<AdminTours />} />
              <Route path="content" element={<AdminContent />} />
              <Route path="site-content" element={<AdminSiteContent />} />
            </Route>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute role="customer">
                  <CustomerDataProvider>
                    <CustomerLayout />
                  </CustomerDataProvider>
                </ProtectedRoute>
              }
            >
              <Route index element={<CustomerBookings />} />
              <Route path="history" element={<TourHistory />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </Suspense>
      </SiteContentProvider>
    </Router>
  );
}

export default App;
