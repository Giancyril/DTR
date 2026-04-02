import { useState } from "react";
import { useChangePasswordMutation, useUpdateProfileMutation } from "../../redux/api/api";
import { useUser } from "../../auth/auth";
import { toast } from "react-toastify";
import { FaLock, FaUser, FaEnvelope } from "react-icons/fa";

export default function SettingsPage() {
  const user = useUser();

  const [changePassword,  { isLoading: changingPassword }] = useChangePasswordMutation();
  const [updateName,      { isLoading: updatingName     }] = useUpdateProfileMutation();
  const [updateEmail,     { isLoading: updatingEmail    }] = useUpdateProfileMutation();

  const [nameForm,  setNameForm]  = useState({ name:  user?.name  ?? "" });
  const [emailForm, setEmailForm] = useState({ email: user?.email ?? "" });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword:     "",
    confirmPassword: "",
  });

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword:     passwordForm.newPassword,
      }).unwrap();
      toast.success("Password changed successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to change password");
    }
  };

  const inputCls = "w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30";
  const labelCls = "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5";

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

      {/* Edit name */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-2">
          <FaUser size={10} className="text-gray-500" />
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Edit Name</h2>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await updateName({ name: nameForm.name }).unwrap();
              toast.success("Name updated successfully");
            } catch (err: any) {
              toast.error(err?.data?.message ?? "Failed to update name");
            }
          }}
          className="p-5 space-y-3.5"
        >
          <div>
            <label className={labelCls}>Full Name</label>
            <div className="relative">
              <FaUser size={10} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="text"
                required
                value={nameForm.name}
                onChange={e => setNameForm({ name: e.target.value })}
                className={inputCls + " pl-9"}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={updatingName}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all mt-1"
          >
            {updatingName ? "Saving..." : "Save Name"}
          </button>
        </form>
      </div>

      {/* Edit email */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-2">
          <FaEnvelope size={10} className="text-gray-500" />
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Edit Email</h2>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await updateEmail({ email: emailForm.email }).unwrap();
              toast.success("Email updated successfully");
            } catch (err: any) {
              toast.error(err?.data?.message ?? "Failed to update email");
            }
          }}
          className="p-5 space-y-3.5"
        >
          <div>
            <label className={labelCls}>Email Address</label>
            <div className="relative">
              <FaEnvelope size={10} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="email"
                required
                value={emailForm.email}
                onChange={e => setEmailForm({ email: e.target.value })}
                className={inputCls + " pl-9"}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={updatingEmail}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all mt-1"
          >
            {updatingEmail ? "Saving..." : "Save Email"}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-2">
          <FaLock size={10} className="text-gray-500" />
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Change Password</h2>
        </div>
        <form onSubmit={handlePasswordSubmit} className="p-5 space-y-3.5">
          {[
            { label: "Current Password", key: "currentPassword" },
            { label: "New Password",     key: "newPassword"     },
            { label: "Confirm Password", key: "confirmPassword" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <input
                type="password"
                required
                value={(passwordForm as any)[key]}
                onChange={e => setPasswordForm(f => ({ ...f, [key]: e.target.value }))}
                className={inputCls}
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={changingPassword}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all mt-1"
          >
            {changingPassword ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}