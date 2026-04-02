import { useState, useRef, useEffect } from "react";
import { useGetUsersQuery, useRegisterMutation, useDeleteUserMutation, useUpdateUserMutation } from "../../redux/api/api";
import { toast } from "react-toastify";
import { FaPlus, FaTimes, FaTrash, FaEdit, FaClock } from "react-icons/fa";
import type { User } from "../../types/types";

// ── Custom Time Picker ────────────────────────────────────────────────────────
function TimePicker({
  value,
  onChange,
  placeholder = "-- : -- --",
  accentColor = "blue",
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  accentColor?: "blue" | "indigo";
}) {
  const [open, setOpen] = useState(false);
  const ref             = useRef<HTMLDivElement>(null);

  const hours   = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const minutes = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
  const periods = ["AM", "PM"];

  const parse = (v: string) => {
    if (!v) return { h: "", m: "", p: "AM" };
    const [hh, mm] = v.split(":");
    const h24 = parseInt(hh, 10);
    const p   = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
    return { h: String(h12).padStart(2, "0"), m: mm, p };
  };

  const { h, m, p } = parse(value);

  const buildValue = (hour: string, min: string, period: string) => {
    let h24 = parseInt(hour, 10);
    if (period === "AM" && h24 === 12) h24 = 0;
    if (period === "PM" && h24 !== 12) h24 += 12;
    return `${String(h24).padStart(2, "0")}:${min}`;
  };

  const setH = (hour: string)   => onChange(buildValue(hour, m || "00", p));
  const setM = (min: string)    => onChange(buildValue(h || "12", min, p));
  const setP = (period: string) => onChange(buildValue(h || "12", m || "00", period));

  const display = value ? `${h}:${m} ${p}` : placeholder;

  const accent = {
    blue:   { ring: "ring-blue-500/30",   badge: "bg-blue-500/10   text-blue-400   border-blue-500/20",   col: "text-blue-400"   },
    indigo: { ring: "ring-indigo-500/30", badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", col: "text-indigo-400" },
  }[accentColor];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-sm cursor-pointer select-none transition-all ring-2 ${open ? accent.ring : "ring-transparent"} ${value ? "text-white" : "text-gray-500"}`}
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <FaClock size={11} className={value ? accent.col : "text-gray-600"} />
          <span className="font-medium tracking-wide text-xs">{display}</span>
        </div>
        {value && (
          <span role="button" onClick={e => { e.stopPropagation(); onChange(""); }}
            className="text-gray-600 hover:text-gray-400 transition-colors cursor-pointer">
            <FaTimes size={9} />
          </span>
        )}
      </div>

      {open && (
        <div className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
          <div className="p-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 text-center">Hour</p>
                <div className="space-y-0.5 max-h-[160px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                  {hours.map(hh => (
                    <button key={hh} type="button" onClick={() => setH(hh)}
                      className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-all ${h === hh ? `${accent.badge} border` : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
                      {hh}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center pt-6"><span className="text-gray-600 font-bold">:</span></div>
              <div className="flex-1">
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 text-center">Min</p>
                <div className="space-y-0.5 max-h-[160px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                  {minutes.map(mm => (
                    <button key={mm} type="button" onClick={() => setM(mm)}
                      className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-all ${m === mm ? `${accent.badge} border` : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
                      {mm}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-14">
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 text-center">AM/PM</p>
                <div className="space-y-1">
                  {periods.map(pp => (
                    <button key={pp} type="button" onClick={() => setP(pp)}
                      className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${p === pp ? `${accent.badge} border` : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
                      {pp}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)}
              className="w-full mt-3 py-2 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-300 text-xs font-semibold rounded-xl transition-colors">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Employees Page ────────────────────────────────────────────────────────────
export default function EmployeesPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const { data, isLoading } = useGetUsersQuery(undefined);
  const [deleteUser] = useDeleteUserMutation();

  const users     = (data?.data as User[]) ?? [];
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

  const fmtSchedule = (u: User) => {
    if (!u.workStart || !u.workEnd) return null;
    const fmt = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      const ampm = h >= 12 ? "PM" : "AM";
      const h12  = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
    };
    return `${fmt(u.workStart)} – ${fmt(u.workEnd)}`;
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
                <div className="hidden sm:block text-center min-w-0">
                  <p className="text-gray-300 text-xs">{u.department ?? "—"}</p>
                  <p className="text-gray-500 text-[10px]">{u.position ?? "—"}</p>
                </div>
                {fmtSchedule(u) && (
                  <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg shrink-0">
                    <FaClock size={9} className="text-blue-400" />
                    <span className="text-[10px] text-blue-300 font-semibold whitespace-nowrap">{fmtSchedule(u)}</span>
                  </div>
                )}
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

      {showAdd && <AddEmployeeModal onClose={() => setShowAdd(false)} />}
      {editing  && <EditEmployeeModal user={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

// ── Add Employee Modal ────────────────────────────────────────────────────────
function AddEmployeeModal({ onClose }: { onClose: () => void }) {
  const [register, { isLoading }] = useRegisterMutation();
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    department: "", position: "", role: "EMPLOYEE" as const,
    workStart: "08:00", workEnd: "17:00",
  });

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

  const inputCls = "w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-xs placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30";
  const labelCls = "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <h3 className="text-sm font-bold text-white">Add Employee</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <FaTimes size={12} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto">
          {[
            { label: "Full Name",  key: "name",       type: "text"     },
            { label: "Email",      key: "email",      type: "email"    },
            { label: "Password",   key: "password",   type: "password" },
            { label: "Department", key: "department", type: "text"     },
            { label: "Position",   key: "position",   type: "text"     },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <input type={type} required={["name","email","password"].includes(key)}
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className={inputCls} />
            </div>
          ))}

          <div>
            <label className={labelCls}>Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}
              className={inputCls + " appearance-none"}>
              <option value="EMPLOYEE">Employee</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {/* Work Schedule */}
          <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FaClock size={10} className="text-blue-400" />
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Work Schedule</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Start Time</label>
                <TimePicker value={form.workStart} onChange={v => setForm(f => ({ ...f, workStart: v }))} accentColor="blue" />
              </div>
              <div>
                <label className={labelCls}>End Time</label>
                <TimePicker value={form.workEnd} onChange={v => setForm(f => ({ ...f, workEnd: v }))} accentColor="indigo" />
              </div>
            </div>
            <p className="text-[10px] text-gray-500">Used to automatically determine late and absent status.</p>
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

// ── Edit Employee Modal ───────────────────────────────────────────────────────
function EditEmployeeModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [updateUser, { isLoading }] = useUpdateUserMutation();
  const [form, setForm] = useState({
    name:       user.name,
    department: user.department ?? "",
    position:   user.position   ?? "",
    role:       user.role,
    workStart:  user.workStart  ?? "08:00",
    workEnd:    user.workEnd    ?? "17:00",
  });

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

  const inputCls = "w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30";
  const labelCls = "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-white">Edit Employee</h3>
            <p className="text-gray-500 text-xs mt-0.5">{user.name}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <FaTimes size={12} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto">
          {[
            { label: "Full Name",  key: "name",       type: "text" },
            { label: "Department", key: "department", type: "text" },
            { label: "Position",   key: "position",   type: "text" },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <input type={type} value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className={inputCls} />
            </div>
          ))}

          <div>
            <label className={labelCls}>Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}
              className={inputCls + " appearance-none"}>
              <option value="EMPLOYEE">Employee</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {/* Work Schedule */}
          <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FaClock size={10} className="text-blue-400" />
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Work Schedule</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Start Time</label>
                <TimePicker value={form.workStart} onChange={v => setForm(f => ({ ...f, workStart: v }))} accentColor="blue" />
              </div>
              <div>
                <label className={labelCls}>End Time</label>
                <TimePicker value={form.workEnd} onChange={v => setForm(f => ({ ...f, workEnd: v }))} accentColor="indigo" />
              </div>
            </div>
            <p className="text-[10px] text-gray-500">Used to automatically determine late and absent status.</p>
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