import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useSiteContent } from "../../context/SiteContentContext";
import { CONTENT_TYPES } from "../../data/contentTypes";
import { compressImage } from "../../utils/imageCompress";
import { Table, Thead, Th, Tr, Td } from "../shared/Table";
import FormDialog from "./FormDialog";

const emptyForm = (config) => Object.fromEntries(config.fields.map((f) => [f.key, ""]));

const CollectionEditor = ({ contentKey }) => {
  const { content, addItem, updateItem, deleteItem } = useSiteContent();
  const config = CONTENT_TYPES[contentKey];
  const rows = content[contentKey];

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm(config));
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm(config));
    setFile(null);
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    const next = {};
    config.fields.forEach((f) => {
      next[f.key] = f.isBadges ? (row[f.key] || []).join(", ") : row[f.key] || "";
    });
    setForm(next);
    setFile(null);
    setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingId && !file) {
      toast.error("Please choose an image");
      return;
    }

    setSaving(true);
    try {
      const updates = {};
      config.fields.forEach((f) => {
        updates[f.key] = f.isBadges
          ? form[f.key].split(",").map((s) => s.trim()).filter(Boolean)
          : form[f.key];
      });
      if (file) {
        updates[config.imageField] = await compressImage(file);
      }

      if (editingId) {
        await updateItem(contentKey, editingId, updates);
        toast.success("Updated");
      } else {
        await addItem(contentKey, updates);
        toast.success("Added");
      }
      setOpen(false);
    } catch {
      toast.error("Something went wrong compressing that image");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await deleteItem(contentKey, id);
    toast.success("Deleted");
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{config.label}</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/80"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      <Table>
        <Thead>
          <Th>Image</Th>
          {config.fields.map((f) => (
            <Th key={f.key}>{f.label}</Th>
          ))}
          <Th>Actions</Th>
        </Thead>
        <tbody>
          {rows.map((row) => (
            <Tr key={row.id}>
              <Td>
                <img src={row[config.imageField]} alt="" className="h-12 w-16 rounded-lg object-cover" />
              </Td>
              {config.fields.map((f) => (
                <Td key={f.key} className="max-w-xs truncate">
                  {f.isBadges ? (row[f.key] || []).join(", ") : row[f.key]}
                </Td>
              ))}
              <Td>
                <div className="flex gap-3">
                  <button onClick={() => openEdit(row)} className="text-mutedText/70 hover:text-primary">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(row.id)} className="text-mutedText/70 hover:text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>

      <FormDialog open={open} onOpenChange={setOpen} title={editingId ? `Edit ${config.label}` : `Add ${config.label}`}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {config.fields.map((f) =>
            f.multiline ? (
              <textarea
                key={f.key}
                placeholder={f.label}
                value={form[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                rows={4}
                className="rounded-lg border border-primary/30 bg-secondary px-3 py-2 text-sm"
              />
            ) : (
              <input
                key={f.key}
                placeholder={f.label}
                value={form[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="rounded-lg border border-primary/30 bg-secondary px-3 py-2 text-sm"
              />
            )
          )}
          <div>
            <label className="mb-1 block text-sm text-mutedText/70">
              Image {editingId && "(leave blank to keep current)"}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-mutedText/70"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/80 disabled:opacity-50"
          >
            {saving ? "Saving..." : editingId ? "Save changes" : "Add"}
          </button>
        </form>
      </FormDialog>
    </div>
  );
};

export default CollectionEditor;
