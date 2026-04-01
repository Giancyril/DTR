import { useState } from "react";
import { useGetDTRSummaryQuery, useGetUsersQuery } from "../../redux/api/api";
import { useUser, isAdmin } from "../../auth/auth";
import { FaFileAlt, FaCalendarAlt, FaPrint } from "react-icons/fa";
import type { AttendanceRecord, User } from "../../types/types";

const fmt     = (d: string | null | undefined) => d ? new Date(d).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }) : "—";
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" });

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

// ── Quick range helpers ───────────────────────────────────────────────────────
const toISO = (d: Date) => d.toISOString().split("T")[0];

const getRange = (type: "this-week" | "last-week" | "this-month" | "last-month") => {
  const now = new Date();
  if (type === "this-week") {
    const mon = new Date(now); mon.setDate(now.getDate() - now.getDay() + 1);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { dateFrom: toISO(mon), dateTo: toISO(sun) };
  }
  if (type === "last-week") {
    const mon = new Date(now); mon.setDate(now.getDate() - now.getDay() - 6);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { dateFrom: toISO(mon), dateTo: toISO(sun) };
  }
  if (type === "this-month") {
    return {
      dateFrom: toISO(new Date(now.getFullYear(), now.getMonth(), 1)),
      dateTo:   toISO(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    };
  }
  if (type === "last-month") {
    return {
      dateFrom: toISO(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      dateTo:   toISO(new Date(now.getFullYear(), now.getMonth(), 0)),
    };
  }
  return { dateFrom: "", dateTo: "" };
};

export default function DTRPage() {
  const currentUser = useUser();
  const admin       = isAdmin();

  const { data: usersData } = useGetUsersQuery(undefined, { skip: !admin });
  const users = (usersData?.data as User[]) ?? [];

  const [selectedUserId, setSelectedUserId] = useState("");
  const [dateFrom, setDateFrom] = useState(toISO(new Date(new Date().setDate(1))));
  const [dateTo,   setDateTo]   = useState(toISO(new Date()));

  const userId = admin ? selectedUserId : (currentUser?.id ?? "");

  const { data, isLoading, isFetching } = useGetDTRSummaryQuery(
    { userId, dateFrom, dateTo },
    { skip: !userId || !dateFrom || !dateTo }
  );

  const records = (data?.records as AttendanceRecord[]) ?? [];
  const summary = data?.summary;

  const applyRange = (type: "this-week" | "last-week" | "this-month" | "last-month") => {
    const r = getRange(type);
    setDateFrom(r.dateFrom);
    setDateTo(r.dateTo);
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-white text-xl font-bold">DTR Summary</h1>
          <p className="text-gray-500 text-xs mt-0.5">Daily Time Record</p>
        </div>
        {records.length > 0 && (
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-300 text-xs font-bold rounded-xl transition-all">
            <FaPrint size={10} /> Print DTR
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-2">
          <FaCalendarAlt size={10} className="text-gray-500" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Period</span>
        </div>

        {/* Quick ranges */}
        <div className="flex flex-wrap gap-2">
          {(["this-week","last-week","this-month","last-month"] as const).map(r => (
            <button key={r} onClick={() => applyRange(r)}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-400 hover:text-white text-[10px] font-semibold rounded-lg transition-all capitalize">
              {r.replace("-", " ")}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {admin && (
            <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}
              className="px-3 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30">
              <option value="">Select employee</option>
              {users.filter(u => u.role === "EMPLOYEE").map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          )}
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total Hours",   value: `${summary.totalHours}h`,  color: "text-blue-400"    },
            { label: "Present Days",  value: summary.presentDays,        color: "text-emerald-400" },
            { label: "Absent Days",   value: summary.absentDays,         color: "text-red-400"     },
            { label: "Late Days",     value: summary.lateDays,           color: "text-amber-400"   },
            { label: "Half Days",     value: summary.halfDays,           color: "text-purple-400"  },
            { label: "Total Days",    value: summary.totalDays,          color: "text-gray-300"    },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-900 border border-white/5 rounded-2xl p-4 text-center">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-gray-500 text-[10px] mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Records table */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-2">
          <FaFileAlt size={11} className="text-gray-500" />
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Daily Records</h2>
        </div>

        {isLoading || isFetching ? (
          <div className="p-8 space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-800 rounded-xl animate-pulse" />)}
          </div>
        ) : !userId ? (
          <div className="py-16 text-center">
            <FaFileAlt size={24} className="text-gray-700 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">{admin ? "Select an employee to view their DTR" : "Loading..."}</p>
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500 text-sm">No records for this period</p>
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
                    <td className="px-4 py-3 text-gray-300 text-xs font-semibold">
                      {r.hoursWorked ? `${r.hoursWorked}h` : "—"}
                    </td>
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