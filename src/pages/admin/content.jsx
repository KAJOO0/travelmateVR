import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";
import { Table, Thead, Th, Tr, Td } from "../../components/shared/Table";
import StatusBadge from "../../components/shared/StatusBadge";
import FormDialog from "../../components/admin/FormDialog";

const EMPTY_FORM = { title: "", author: "", status: "draft" };

const Content = () => {
  const { content, addContent, updateContent, deleteContent } = useAdminData();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const openAddDialog = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEditDialog = (post) => {
    setEditingId(post.id);
    setForm({ title: post.title, author: post.author, status: post.status });
    setOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim()) return;

    if (editingId) {
      updateContent(editingId, form);
      toast.success("Post updated");
    } else {
      addContent(form);
      toast.success("Post added");
    }
    setOpen(false);
  };

  const handleDelete = (id) => {
    deleteContent(id);
    toast.success("Post deleted");
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Content</h1>
        <button
          onClick={openAddDialog}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/80"
        >
          <Plus size={16} /> Add post
        </button>
      </div>

      <Table>
        <Thead>
          <Th>Title</Th>
          <Th>Author</Th>
          <Th>Status</Th>
          <Th>Actions</Th>
        </Thead>
        <tbody>
          {content.map((c) => (
            <Tr key={c.id}>
              <Td>{c.title}</Td>
              <Td>{c.author}</Td>
              <Td><StatusBadge status={c.status} /></Td>
              <Td>
                <div className="flex gap-3">
                  <button onClick={() => openEditDialog(c)} className="text-mutedText/70 hover:text-primary">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="text-mutedText/70 hover:text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>

      <FormDialog open={open} onOpenChange={setOpen} title={editingId ? "Edit post" : "Add post"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="rounded-lg border border-primary/30 bg-secondary px-3 py-2 text-sm"
          />
          <input
            placeholder="Author"
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
            className="rounded-lg border border-primary/30 bg-secondary px-3 py-2 text-sm"
          />
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="rounded-lg border border-primary/30 bg-secondary px-3 py-2 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/80">
            {editingId ? "Save changes" : "Add post"}
          </button>
        </form>
      </FormDialog>
    </div>
  );
};

export default Content;
