import { useState } from "react";
import { useGetAttendanceQuery } from "../../redux/api/api";
import { useUser } from "../../auth/auth";
import type { AttendanceRecord } from "../../types/types";

const fmt     = (d: string | null | undefined) => d ? new Date(d).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }) : "—";
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

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

export default function MyAttendancePage() {
  const user = useUser();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  const { data, isLoading } = useGetAttendanceQuery(
    { userId: user?.id, dateFrom, dateTo },
    { skip: !user?.id }
  );

  const records = (data?.records as AttendanceRecord[]) ?? [];
  const totalHours = records.reduce((sum, r) => sum + (r.hoursWorked ?? 0), 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-white text-xl font-bold">My Attendance</h1>
        <p className="text-gray-500 text-xs mt-0.5">Your personal attendance history</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-white/8 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-white/8 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
        </div>
      </div>

      {/* Stats */}
      {records.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Hours",  value: `${Math.round(totalHours * 100) / 100}h`, color: "text-blue-400"    },
            { label: "Present",      value: records.filter(r => r.status === "PRESENT").length,  color: "text-emerald-400" },
            { label: "Absent",       value: records.filter(r => r.status === "ABSENT").length,   color: "text-red-400"     },
            { label: "Late",         value: records.filter(r => r.status === "LATE").length,     color: "text-amber-400"   },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-900 border border-white/5 rounded-2xl p-4 text-center">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-gray-500 text-[10px] mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Records</h2>
          <span className="text-[10px] text-gray-600">{records.length} entries</span>
        </div>

        {isLoading ? (
          <div className="p-8 space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-800 rounded-xl animate-pulse" />)}
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500 text-sm">No records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["Date","Time In","Time Out","Hours","Status","Remarks"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-white text-xs font-medium">{fmtDate(r.date)}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{fmt(r.timeIn)}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{fmt(r.timeOut)}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs font-semibold">{r.hoursWorked ? `${r.hoursWorked}h` : "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.remarks ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}