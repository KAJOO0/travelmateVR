import { createContext, useContext, useState } from "react";
import { initialBookings, initialTours, initialContent } from "../data/mockAdmin";

const AdminDataContext = createContext(null);

let nextId = 1000;
const genId = () => nextId++;

export const AdminDataProvider = ({ children }) => {
  const [bookings, setBookings] = useState(initialBookings);
  const [tours, setTours] = useState(initialTours);
  const [content, setContent] = useState(initialContent);

  const updateBookingStatus = (id, status) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  };

  const addTour = (tour) => setTours((prev) => [...prev, { ...tour, id: genId() }]);
  const updateTour = (id, updates) =>
    setTours((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  const deleteTour = (id) => setTours((prev) => prev.filter((t) => t.id !== id));

  const addContent = (post) => setContent((prev) => [...prev, { ...post, id: genId() }]);
  const updateContent = (id, updates) =>
    setContent((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  const deleteContent = (id) => setContent((prev) => prev.filter((c) => c.id !== id));

  return (
    <AdminDataContext.Provider
      value={{
        bookings,
        updateBookingStatus,
        tours,
        addTour,
        updateTour,
        deleteTour,
        content,
        addContent,
        updateContent,
        deleteContent,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
};

export const useAdminData = () => {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData must be used within AdminDataProvider");
  return ctx;
};
