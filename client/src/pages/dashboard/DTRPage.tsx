import { useState, useRef, useEffect } from "react";
import { useGetDTRSummaryQuery, useGetUsersQuery, useExportDTRMutation } from "../../redux/api/api";
import { useUser, isAdmin } from "../../auth/auth";
import { toast } from "react-toastify";
import {
  FaFileAlt, FaCalendarAlt, FaFilePdf, FaTimes,
  FaChevronLeft, FaChevronRight, FaDownload,
} from "react-icons/fa";
import type { AttendanceRecord, User } from "../../types/types";

const fmt = (d: string | null | undefined) => {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" });
};

const fmtDate = (d: string) => {
  const datePart = d.split("T")[0];
  const [y, m, day] = datePart.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" });
};

const toISO = (d: Date) => {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

// ── Custom Date Picker ────────────────────────────────────────────────────────
function DatePicker({
  value, onChange, placeholder = "Select date",
}: {
  value: string; onChange: (val: string) => void; placeholder?: string;
}) {
  const [open,      setOpen]      = useState(false);
  const [viewYear,  setViewYear]  = useState(() => value ? parseInt(value.split("-")[0]) : new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => value ? parseInt(value.split("-")[1]) - 1 : new Date().getMonth());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const isSelected = (day: number) => {
    if (!value) return false;
    const [y, m, d] = value.split("-").map(Number);
    return y === viewYear && (m - 1) === viewMonth && d === day;
  };
  const isToday = (day: number) => {
    const t = new Date();
    return t.getFullYear() === viewYear && t.getMonth() === viewMonth && t.getDate() === day;
  };
  const pick = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
  };
  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };
  const display = (() => {
    if (!value) return placeholder;
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  })();

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2 px-3 py-2.5 bg-gray-800 border border-white/8 rounded-xl cursor-pointer select-none transition-all ring-2 ${open ? "ring-blue-500/30" : "ring-transparent"} ${value ? "text-white" : "text-gray-500"}`}>
        <FaCalendarAlt size={11} className={value ? "text-blue-400" : "text-gray-600"} />
        <span className="text-sm font-medium flex-1 truncate whitespace-nowrap">{display}</span>
        {value && (
          <span role="button" onClick={e => { e.stopPropagation(); onChange(""); }} className="text-gray-600 hover:text-gray-400 transition-colors cursor-pointer shrink-0">
            <FaTimes size={9} />
          </span>
        )}
      </div>
      {open && (
        <div className="absolute z-50 top-full mt-1.5 left-0 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/60 w-64 overflow-hidden">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={prevMonth} className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <FaChevronLeft size={9} />
              </button>
              <span className="text-white text-xs font-bold">{MONTHS[viewMonth]} {viewYear}</span>
              <button type="button" onClick={nextMonth} className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <FaChevronRight size={9} />
              </button>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => <div key={d} className="text-center text-[9px] font-bold text-gray-500 uppercase py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((day, i) => (
                <div key={i}>
                  {day === null ? <div /> : (
                    <button type="button" onClick={() => pick(day)}
                      className={`w-full aspect-square rounded-lg text-xs font-semibold transition-all ${isSelected(day) ? "bg-blue-600 text-white" : isToday(day) ? "bg-blue-500/15 text-blue-400 border border-blue-500/30" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
                      {day}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3 pt-2.5 border-t border-white/5">
              <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="text-[11px] text-gray-500 hover:text-gray-300 font-semibold transition-colors">Clear</button>
              <button type="button" onClick={() => { const t = new Date(); setViewYear(t.getFullYear()); setViewMonth(t.getMonth()); pick(t.getDate()); }} className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold transition-colors">Today</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
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
  // last-month
  return {
    dateFrom: toISO(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
    dateTo:   toISO(new Date(now.getFullYear(), now.getMonth(), 0)),
  };
};

// ── Main DTR Page ─────────────────────────────────────────────────────────────
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

  const [exportDTR, { isLoading: isExporting }] = useExportDTRMutation();

  const records = (data?.records as AttendanceRecord[]) ?? [];
  const summary = data?.summary;

  const applyRange = (type: "this-week" | "last-week" | "this-month" | "last-month") => {
    const r = getRange(type);
    setDateFrom(r.dateFrom);
    setDateTo(r.dateTo);
  };

  const handleExportPDF = async () => {
  if (!userId || !dateFrom || !dateTo) {
    toast.error("Please select an employee and date range first");
    return;
  }
  try {
    const result = await exportDTR({ userId, dateFrom, dateTo }).unwrap() as any;
    console.log("export result:", JSON.stringify(result).slice(0, 200));

    // Handle both { base64 } and { data: { base64 } } response shapes
    const base64String: string = result?.base64 ?? result?.data?.base64;

    if (!base64String) {
      toast.error("Invalid PDF response from server");
      return;
    }

    // Decode base64 → Blob → download
    const binary = atob(base64String);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: "application/pdf" });

    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    const emp  = users.find(u => u.id === userId);
    const name = emp ? emp.name.replace(/\s+/g, "_") : userId.slice(0, 8);
    a.download = `DTR_${name}_${dateFrom}_${dateTo}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("DTR exported successfully");
  } catch (err: any) {
    toast.error(err?.data?.message ?? "Failed to export PDF");
  }
};

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-white text-xl font-bold">DTR Summary</h1>
          <p className="text-gray-500 text-xs mt-0.5">Daily Time Record</p>
        </div>

        {/* Export button — shown when there are records */}
        {records.length > 0 && (
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <FaFilePdf size={11} />
                Export CS Form 48
              </>
            )}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-2">
          <FaCalendarAlt size={10} className="text-gray-500" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Period</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(["this-week","last-week","this-month","last-month"] as const).map(r => (
            <button key={r} onClick={() => applyRange(r)}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-400 hover:text-white text-[10px] font-semibold rounded-lg transition-all capitalize text-center w-full">
              {r.replace(/-/g, " ")}
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
          <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="From date" />
          <DatePicker value={dateTo}   onChange={setDateTo}   placeholder="To date"   />
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total Hours",  value: `${summary.totalHours}h`, color: "text-blue-400"    },
            { label: "Present Days", value: summary.presentDays,       color: "text-emerald-400" },
            { label: "Absent Days",  value: summary.absentDays,        color: "text-red-400"     },
            { label: "Late Days",    value: summary.lateDays,          color: "text-amber-400"   },
            { label: "Half Days",    value: summary.halfDays,          color: "text-purple-400"  },
            { label: "Total Days",   value: summary.totalDays,         color: "text-gray-300"    },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-900 border border-white/5 rounded-2xl p-4 text-center">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-gray-500 text-[10px] mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Export hint banner — shown when records exist */}
      {records.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-500/5 border border-blue-500/15 rounded-xl">
          <FaDownload size={11} className="text-blue-400 shrink-0" />
          <p className="text-blue-300/80 text-xs">
            Click <span className="font-bold text-blue-400">Export CS Form 48</span> to download a printable PDF in the official government DTR format.
          </p>
        </div>
      )}

      {/* Records table */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaFileAlt size={11} className="text-gray-500" />
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Daily Records</h2>
          </div>
          <span className="text-[10px] text-gray-600">{records.length} entries</span>
        </div>

        {isLoading || isFetching ? (
          <div className="p-5 space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />)}
          </div>
        ) : !userId ? (
          <div className="py-16 text-center">
            <FaFileAlt size={24} className="text-gray-700 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">{admin ? "Select an employee to view their DTR" : "Loading..."}</p>
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center">
            <FaFileAlt size={24} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No records for this period</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-gray-800/30">
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date</th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-blue-400/70 uppercase tracking-widest border-l border-white/5">AM In</th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-blue-400/70 uppercase tracking-widest">AM Out</th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-indigo-400/70 uppercase tracking-widest border-l border-white/5">PM In</th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-indigo-400/70 uppercase tracking-widest">PM Out</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest border-l border-white/5">Hours</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-amber-400/70 uppercase tracking-widest">Overtime</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {records.map(r => {
                    const overtime = r.hoursWorked && r.hoursWorked > 8
                      ? Math.round((r.hoursWorked - 8) * 60)
                      : 0;
                    return (
                      <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-white text-xs font-medium whitespace-nowrap">{fmtDate(r.date)}</td>
                        <td className="px-4 py-3 text-center text-blue-300/80 text-xs border-l border-white/[0.04]">{fmt(r.amTimeIn)}</td>
                        <td className="px-4 py-3 text-center text-blue-300/80 text-xs">{fmt(r.amTimeOut)}</td>
                        <td className="px-4 py-3 text-center text-indigo-300/80 text-xs border-l border-white/[0.04]">{fmt(r.pmTimeIn)}</td>
                        <td className="px-4 py-3 text-center text-indigo-300/80 text-xs">{fmt(r.pmTimeOut)}</td>
                        <td className="px-4 py-3 text-gray-300 text-xs font-semibold border-l border-white/[0.04]">
                          {r.hoursWorked ? `${r.hoursWorked}h` : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {overtime > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                              +{overtime}m
                            </span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{r.remarks ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-white/[0.04]">
              {records.map(r => {
                const overtime = r.hoursWorked && r.hoursWorked > 8
                  ? Math.round((r.hoursWorked - 8) * 60)
                  : 0;
                return (
                  <div key={r.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-white text-sm font-semibold">{fmtDate(r.date)}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={r.status} />
                        {r.hoursWorked && (
                          <span className="text-xs font-bold text-white bg-gray-800 border border-white/10 px-2 py-0.5 rounded-lg">
                            {r.hoursWorked}h
                          </span>
                        )}
                        {overtime > 0 && (
                          <span className="text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                            +{overtime}m OT
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3">
                        <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-2">Morning</p>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-[9px] text-gray-500">In</span>
                            <span className="text-blue-300/80 text-[10px] font-semibold">{fmt(r.amTimeIn)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[9px] text-gray-500">Out</span>
                            <span className="text-blue-300/80 text-[10px] font-semibold">{fmt(r.amTimeOut)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3">
                        <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Afternoon</p>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-[9px] text-gray-500">In</span>
                            <span className="text-indigo-300/80 text-[10px] font-semibold">{fmt(r.pmTimeIn)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[9px] text-gray-500">Out</span>
                            <span className="text-indigo-300/80 text-[10px] font-semibold">{fmt(r.pmTimeOut)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {r.remarks && <p className="text-gray-500 text-[10px] italic">{r.remarks}</p>}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}