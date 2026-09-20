import { useState } from "react";
import toast from "react-hot-toast";
import { useCustomerData } from "../../context/CustomerDataContext";

const Profile = () => {
  const { profile, updateProfile } = useCustomerData();
  const [form, setForm] = useState(profile);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    updateProfile(form);
    toast.success("Profile updated");
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Profile</h1>
      <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm text-mutedText/70">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-primary/30 bg-secondary px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-mutedText/70">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border border-primary/30 bg-secondary px-3 py-2 text-sm text-white"
          />
        </div>
        <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/80">
          Save changes
        </button>
      </form>
    </div>
  );
};

export default Profile;
