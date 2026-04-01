import { useState } from "react";
import {
  useGetAttendanceQuery, useManualEntryMutation,
  useDeleteAttendanceMutation, useGetUsersQuery,
} from "../../redux/api/api";
import { toast } from "react-toastify";
import { FaPlus, FaTimes, FaTrash, FaFilter } from "react-icons/fa";
import type { AttendanceRecord, User } from "../../types/types";

const fmt     = (d: string | null | undefined) => d ? new Date(d).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }) : "—";
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    PRESENT:  "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    ABSENT:   "bg-red-500/15 text-red-400 border-red-500/20",
    LATE:     "bg-amber-500/15 text-amber-400 border-amber-500/20",
    HALF_DAY: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${map[status] ?? "bg-gray-500/15 text-gray-400 border-gray-500/20"}`}>
      {status.replace("_", " ")}
    </span>
  );
};

export default function AttendancePage() {
  const [showModal,  setShowModal]  = useState(false);
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "", userId: "", status: "" });

  const { data, isLoading } = useGetAttendanceQuery(filters);
  const { data: usersData  } = useGetUsersQuery(undefined);
  const [deleteRecord] = useDeleteAttendanceMutation();

  const records = (data?.records as AttendanceRecord[]) ?? [];
  const users   = (usersData?.data as User[]) ?? [];

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    try {
      await deleteRecord(id).unwrap();
      toast.success("Record deleted");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to delete");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-white text-xl font-bold">Attendance Records</h1>
          <p className="text-gray-500 text-xs mt-0.5">All employee attendance logs</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all"
        >
          <FaPlus size={10} /> Manual Entry
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <FaFilter size={10} className="text-gray-500" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Filters</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <input type="date" value={filters.dateFrom}
            onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
            className="px-3 py-2 bg-gray-800 border border-white/8 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          <input type="date" value={filters.dateTo}
            onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
            className="px-3 py-2 bg-gray-800 border border-white/8 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          <select value={filters.userId}
            onChange={e => setFilters(f => ({ ...f, userId: e.target.value }))}
            className="px-3 py-2 bg-gray-800 border border-white/8 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30">
            <option value="">All Employees</option>
            {users.filter(u => u.role === "EMPLOYEE").map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <select value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            className="px-3 py-2 bg-gray-800 border border-white/8 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30">
            <option value="">All Status</option>
            {["PRESENT","ABSENT","LATE","HALF_DAY"].map(s => (
              <option key={s} value={s}>{s.replace("_"," ")}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Records</h2>
          <span className="text-[10px] text-gray-600">{records.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-800 rounded-xl animate-pulse" />)}
            </div>
          ) : records.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-500 text-sm">No records found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["Employee","Date","Time In","Time Out","Hours","Status","Manual",""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white text-xs font-semibold">{r.user?.name}</p>
                      <p className="text-gray-500 text-[10px]">{r.user?.department ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{fmtDate(r.date)}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{fmt(r.timeIn)}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{fmt(r.timeOut)}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{r.hoursWorked ? `${r.hoursWorked}h` : "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3">
                      {r.isManual && (
                        <span className="px-2 py-0.5 bg-gray-700 text-gray-400 text-[10px] rounded-full border border-white/10">Manual</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(r.id)}
                        className="w-7 h-7 rounded-lg bg-gray-800 border border-white/5 flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors">
                        <FaTrash size={10} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && <ManualEntryModal users={users} onClose={() => setShowModal(false)} />}
    </div>
  );
}

function ManualEntryModal({ users, onClose }: { users: User[]; onClose: () => void }) {
  const [manualEntry, { isLoading }] = useManualEntryMutation();
  const [form, setForm] = useState({
    userId: "", date: "", timeIn: "", timeOut: "",
    status: "PRESENT" as const, remarks: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await manualEntry({
        ...form,
        timeIn:  form.timeIn  ? `${form.date}T${form.timeIn}`  : undefined,
        timeOut: form.timeOut ? `${form.date}T${form.timeOut}` : undefined,
      }).unwrap();
      toast.success("Attendance recorded");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to save");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="text-sm font-bold text-white">Manual Entry</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <FaTimes size={12} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Employee</label>
            <select required value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30">
              <option value="">Select employee</option>
              {users.filter(u => u.role === "EMPLOYEE").map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date</label>
              <input type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                className="w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                {["PRESENT","ABSENT","LATE","HALF_DAY"].map(s => (
                  <option key={s} value={s}>{s.replace("_"," ")}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Time In</label>
              <input type="time" value={form.timeIn} onChange={e => setForm(f => ({ ...f, timeIn: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Time Out</label>
              <input type="time" value={form.timeOut} onChange={e => setForm(f => ({ ...f, timeOut: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Remarks</label>
            <input value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
              placeholder="Optional"
              className="w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-400 text-xs font-medium rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isLoading}
              className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all">
              {isLoading ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}