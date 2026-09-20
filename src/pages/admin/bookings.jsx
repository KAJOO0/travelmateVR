import toast from "react-hot-toast";
import { useAdminData } from "../../context/AdminDataContext";
import { Table, Thead, Th, Tr, Td } from "../../components/shared/Table";
import StatusBadge from "../../components/shared/StatusBadge";

const STATUS_OPTIONS = ["pending", "confirmed", "cancelled"];

const Bookings = () => {
  const { bookings, updateBookingStatus } = useAdminData();

  const handleStatusChange = (id, status) => {
    updateBookingStatus(id, status);
    toast.success("Booking status updated");
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Bookings</h1>
      <Table>
        <Thead>
          <Th>Traveler</Th>
          <Th>Tour</Th>
          <Th>Date</Th>
          <Th>Status</Th>
          <Th>Update</Th>
        </Thead>
        <tbody>
          {bookings.map((b) => (
            <Tr key={b.id}>
              <Td>{b.traveler}</Td>
              <Td>{b.tour}</Td>
              <Td>{b.date}</Td>
              <Td><StatusBadge status={b.status} /></Td>
              <Td>
                <select
                  value={b.status}
                  onChange={(e) => handleStatusChange(b.id, e.target.value)}
                  className="rounded-lg border border-primary/30 bg-secondary px-2 py-1 text-sm text-titlecolor"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default Bookings;
