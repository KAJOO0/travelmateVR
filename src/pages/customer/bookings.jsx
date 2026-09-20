import { useCustomerData } from "../../context/CustomerDataContext";
import { Table, Thead, Th, Tr, Td } from "../../components/shared/Table";
import StatusBadge from "../../components/shared/StatusBadge";

const CustomerBookings = () => {
  const { bookings } = useCustomerData();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">My Bookings</h1>
      {bookings.length === 0 ? (
        <p className="text-mutedText/70">You don't have any bookings yet.</p>
      ) : (
        <Table>
          <Thead>
            <Th>Tour</Th>
            <Th>Date</Th>
            <Th>Status</Th>
          </Thead>
          <tbody>
            {bookings.map((b) => (
              <Tr key={b.id}>
                <Td>{b.tour}</Td>
                <Td>{b.date}</Td>
                <Td><StatusBadge status={b.status} /></Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export default CustomerBookings;
