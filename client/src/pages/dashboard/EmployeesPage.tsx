import { useState } from "react";
import { useGetUsersQuery, useRegisterMutation, useDeleteUserMutation, useUpdateUserMutation } from "../../redux/api/api";
import { toast } from "react-toastify";
import { FaPlus, FaTimes, FaTrash, FaEdit } from "react-icons/fa";
import type { User } from "../../types/types";

export default function EmployeesPage() {
  const [showAdd,  setShowAdd]  = useState(false);
  const [editing,  setEditing]  = useState<User | null>(null);

  const { data, isLoading } = useGetUsersQuery(undefined);
  const [deleteUser] = useDeleteUserMutation();

  const users = (data?.data as User[]) ?? [];
  const employees = users.filter(u => u.role === "EMPLOYEE");

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this employee?")) return;
    try {
      await deleteUser(id).unwrap();
      toast.success("Employee deleted");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to delete");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-white text-xl font-bold">Employees</h1>
          <p className="text-gray-500 text-xs mt-0.5">{employees.length} registered employees</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all">
          <FaPlus size={10} /> Add Employee
        </button>
      </div>

      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Employee List</h2>
        </div>

        {isLoading ? (
          <div className="p-8 space-y-2">
            {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-800 rounded-xl animate-pulse" />)}
          </div>
        ) : employees.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500 text-sm">No employees yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {employees.map(u => (
              <div key={u.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-black">{u.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{u.name}</p>
                  <p className="text-gray-500 text-xs truncate">{u.email}</p>
                </div>
                <div className="hidden sm:block text-center">
                  <p className="text-gray-300 text-xs">{u.department ?? "—"}</p>
                  <p className="text-gray-500 text-[10px]">{u.position ?? "—"}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => setEditing(u)}
                    className="w-8 h-8 rounded-lg bg-gray-800 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                    <FaEdit size={10} />
                  </button>
                  <button onClick={() => handleDelete(u.id)}
                    className="w-8 h-8 rounded-lg bg-gray-800 border border-white/5 flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors">
                    <FaTrash size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd   && <AddEmployeeModal   onClose={() => setShowAdd(false)} />}
      {editing   && <EditEmployeeModal  user={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function AddEmployeeModal({ onClose }: { onClose: () => void }) {
  const [register, { isLoading }] = useRegisterMutation();
  const [form, setForm] = useState({ name: "", email: "", password: "", department: "", position: "", role: "EMPLOYEE" as const });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(form).unwrap();
      toast.success("Employee added");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to add employee");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="text-sm font-bold text-white">Add Employee</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <FaTimes size={12} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {[
            { label: "Full Name",   key: "name",       type: "text"     },
            { label: "Email",       key: "email",      type: "email"    },
            { label: "Password",    key: "password",   type: "password" },
            { label: "Department",  key: "department", type: "text"     },
            { label: "Position",    key: "position",   type: "text"     },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label}</label>
              <input type={type} required={["name","email","password"].includes(key)}
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
          ))}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}
              className="w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30">
              <option value="EMPLOYEE">Employee</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-400 text-xs font-medium rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isLoading}
              className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all">
              {isLoading ? "Adding..." : "Add Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditEmployeeModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [updateUser, { isLoading }] = useUpdateUserMutation();
  const [form, setForm] = useState({ name: user.name, department: user.department ?? "", position: user.position ?? "", role: user.role });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser({ id: user.id, ...form }).unwrap();
      toast.success("Employee updated");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to update");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="text-sm font-bold text-white">Edit Employee</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <FaTimes size={12} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {[
            { label: "Full Name",  key: "name",       type: "text" },
            { label: "Department", key: "department", type: "text" },
            { label: "Position",   key: "position",   type: "text" },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label}</label>
              <input type={type} value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
          ))}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}
              className="w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30">
              <option value="EMPLOYEE">Employee</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-400 text-xs font-medium rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isLoading}
              className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all">
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}