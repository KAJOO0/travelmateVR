import { CalendarCheck, MapPinned, FileText, DollarSign } from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";
import StatCard from "../../components/admin/StatCard";
import { Table, Thead, Th, Tr, Td } from "../../components/shared/Table";
import StatusBadge from "../../components/shared/StatusBadge";

const Overview = () => {
  const { bookings, tours, content } = useAdminData();

  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const revenue = confirmedBookings.reduce((sum, b) => {
    const tour = tours.find((t) => t.name === b.tour);
    return sum + (tour?.price ?? 0);
  }, 0);
  const activeTours = tours.filter((t) => t.status === "active").length;
  const publishedPosts = content.filter((c) => c.status === "published").length;
  const recentBookings = [...bookings].slice(-5).reverse();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Overview</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarCheck} label="Total bookings" value={bookings.length} />
        <StatCard icon={DollarSign} label="Confirmed revenue" value={`$${revenue}`} />
        <StatCard icon={MapPinned} label="Active tours" value={activeTours} />
        <StatCard icon={FileText} label="Published posts" value={publishedPosts} />
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Recent bookings</h2>
      <Table>
        <Thead>
          <Th>Traveler</Th>
          <Th>Tour</Th>
          <Th>Date</Th>
          <Th>Status</Th>
        </Thead>
        <tbody>
          {recentBookings.map((b) => (
            <Tr key={b.id}>
              <Td>{b.traveler}</Td>
              <Td>{b.tour}</Td>
              <Td>{b.date}</Td>
              <Td><StatusBadge status={b.status} /></Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default Overview;
