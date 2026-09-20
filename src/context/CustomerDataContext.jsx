import { createContext, useContext, useState } from "react";
import { initialProfile, initialCustomerBookings, initialTourHistory } from "../data/mockCustomer";

const CustomerDataContext = createContext(null);

export const CustomerDataProvider = ({ children }) => {
  const [profile, setProfile] = useState(initialProfile);
  const [bookings] = useState(initialCustomerBookings);
  const [tourHistory] = useState(initialTourHistory);

  const updateProfile = (updates) => setProfile((prev) => ({ ...prev, ...updates }));

  return (
    <CustomerDataContext.Provider value={{ profile, updateProfile, bookings, tourHistory }}>
      {children}
    </CustomerDataContext.Provider>
  );
};

export const useCustomerData = () => {
  const ctx = useContext(CustomerDataContext);
  if (!ctx) throw new Error("useCustomerData must be used within CustomerDataProvider");
  return ctx;
};
