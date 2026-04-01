import { useState } from "react";
import { useChangePasswordMutation } from "../../redux/api/api";
import { useUser } from "../../auth/auth";
import { toast } from "react-toastify";
import { FaLock } from "react-icons/fa";

export default function SettingsPage() {
  const user = useUser();
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword }).unwrap();
      toast.success("Password changed successfully");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to change password");
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-white text-xl font-bold">Settings</h1>
        <p className="text-gray-500 text-xs mt-0.5">Manage your account</p>
      </div>

      {/* Profile info */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-5">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Account</h2>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0">
            <span className="text-white text-base font-black">{user?.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="text-white text-sm font-bold">{user?.name}</p>
            <p className="text-gray-500 text-xs">{user?.email}</p>
            <span className="mt-1 inline-block px-2.5 py-0.5 bg-blue-500/15 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-bold">
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-2">
          <FaLock size={10} className="text-gray-500" />
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Change Password</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {[
            { label: "Current Password", key: "currentPassword" },
            { label: "New Password",     key: "newPassword"     },
            { label: "Confirm Password", key: "confirmPassword" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label}</label>
              <input
                type="password"
                required
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          ))}
          <button type="submit" disabled={isLoading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all mt-1">
            {isLoading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}