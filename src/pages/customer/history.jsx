import { useCustomerData } from "../../context/CustomerDataContext";
import { Table, Thead, Th, Tr, Td } from "../../components/shared/Table";

const TourHistory = () => {
  const { tourHistory } = useCustomerData();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Tour History</h1>
      {tourHistory.length === 0 ? (
        <p className="text-mutedText/70">You haven't experienced any VR tours yet.</p>
      ) : (
        <Table>
          <Thead>
            <Th>Tour</Th>
            <Th>Date experienced</Th>
          </Thead>
          <tbody>
            {tourHistory.map((h) => (
              <Tr key={h.id}>
                <Td>{h.tour}</Td>
                <Td>{h.dateExperienced}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export default TourHistory;
