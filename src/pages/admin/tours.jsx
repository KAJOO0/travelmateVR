import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";
import { Table, Thead, Th, Tr, Td } from "../../components/shared/Table";
import StatusBadge from "../../components/shared/StatusBadge";
import FormDialog from "../../components/admin/FormDialog";

const EMPTY_FORM = { name: "", location: "", price: "", status: "draft" };

const Tours = () => {
  const { tours, addTour, updateTour, deleteTour } = useAdminData();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const openAddDialog = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEditDialog = (tour) => {
    setEditingId(tour.id);
    setForm({ name: tour.name, location: tour.location, price: tour.price, status: tour.status });
    setOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.location.trim() || !form.price) return;

    const payload = { ...form, price: Number(form.price) };
    if (editingId) {
      updateTour(editingId, payload);
      toast.success("Tour updated");
    } else {
      addTour(payload);
      toast.success("Tour added");
    }
    setOpen(false);
  };

  const handleDelete = (id) => {
    deleteTour(id);
    toast.success("Tour deleted");
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tours</h1>
        <button
          onClick={openAddDialog}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/80"
        >
          <Plus size={16} /> Add tour
        </button>
      </div>

      <Table>
        <Thead>
          <Th>Name</Th>
          <Th>Location</Th>
          <Th>Price</Th>
          <Th>Status</Th>
          <Th>Actions</Th>
        </Thead>
        <tbody>
          {tours.map((t) => (
            <Tr key={t.id}>
              <Td>{t.name}</Td>
              <Td>{t.location}</Td>
              <Td>${t.price}</Td>
              <Td><StatusBadge status={t.status} /></Td>
              <Td>
                <div className="flex gap-3">
                  <button onClick={() => openEditDialog(t)} className="text-mutedText/70 hover:text-primary">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="text-mutedText/70 hover:text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>

      <FormDialog open={open} onOpenChange={setOpen} title={editingId ? "Edit tour" : "Add tour"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            placeholder="Tour name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-lg border border-primary/30 bg-secondary px-3 py-2 text-sm"
          />
          <input
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="rounded-lg border border-primary/30 bg-secondary px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="rounded-lg border border-primary/30 bg-secondary px-3 py-2 text-sm"
          />
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="rounded-lg border border-primary/30 bg-secondary px-3 py-2 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
          </select>
          <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/80">
            {editingId ? "Save changes" : "Add tour"}
          </button>
        </form>
      </FormDialog>
    </div>
  );
};

export default Tours;
