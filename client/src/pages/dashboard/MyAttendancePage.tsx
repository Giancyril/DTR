import { useState, useRef, useEffect } from "react";
import { useGetAttendanceQuery } from "../../redux/api/api";
import { useUser } from "../../auth/auth";
import type { AttendanceRecord } from "../../types/types";
import { FaCalendarAlt, FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";

const fmt = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" }) : "—";

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

// ── Date Picker (same as AttendancePage) ─────────────────────────────────────
function DatePicker({ value, onChange, placeholder = "Select date" }: {
  value: string; onChange: (val: string) => void; placeholder?: string;
}) {
  const [open,      setOpen]      = useState(false);
  const [viewYear,  setViewYear]  = useState(() => value ? parseInt(value.split("-")[0]) : new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => value ? parseInt(value.split("-")[1]) - 1 : new Date().getMonth());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

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

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const display = (() => {
    if (!value) return placeholder;
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  })();

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2 px-3 py-2 bg-gray-800 border border-white/8 rounded-xl cursor-pointer select-none transition-all ring-2 ${open ? "ring-blue-500/30" : "ring-transparent"} ${value ? "text-white" : "text-gray-500"}`}>
        <FaCalendarAlt size={11} className={value ? "text-blue-400" : "text-gray-600"} />
        <span className="text-xs font-medium flex-1 truncate whitespace-nowrap">{display}</span>
        {value && (
          <span role="button" onClick={e => { e.stopPropagation(); onChange(""); }}
            className="text-gray-600 hover:text-gray-400 transition-colors cursor-pointer shrink-0">
            <FaTimes size={9} />
          </span>
        )}
      </div>

      {open && (
        <div className="absolute z-50 top-full mt-1.5 left-0 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/60 w-64 overflow-hidden">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={prevMonth}
                className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <FaChevronLeft size={9} />
              </button>
              <span className="text-white text-xs font-bold">{MONTHS[viewMonth]} {viewYear}</span>
              <button type="button" onClick={nextMonth}
                className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <FaChevronRight size={9} />
              </button>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[9px] font-bold text-gray-500 uppercase py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((day, i) => (
                <div key={i}>
                  {day === null ? <div /> : (
                    <button type="button" onClick={() => pick(day)}
                      className={`w-full aspect-square rounded-lg text-xs font-semibold transition-all ${
                        isSelected(day)
                          ? "bg-blue-600 text-white"
                          : isToday(day)
                            ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}>
                      {day}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3 pt-2.5 border-t border-white/5">
              <button type="button" onClick={() => { onChange(""); setOpen(false); }}
                className="text-[11px] text-gray-500 hover:text-gray-300 font-semibold transition-colors">
                Clear
              </button>
              <button type="button" onClick={() => {
                const t = new Date();
                setViewYear(t.getFullYear());
                setViewMonth(t.getMonth());
                pick(t.getDate());
              }}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                Today
              </button>
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
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${map[status] ?? "bg-gray-500/15 text-gray-400 border-gray-500/20"}`}>
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
            <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="From date" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">To</label>
            <DatePicker value={dateTo} onChange={setDateTo} placeholder="To date" />
          </div>
        </div>
      </div>

      {/* Stats */}
      {records.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Hours", value: `${Math.round(totalHours * 100) / 100}h`, color: "text-blue-400"    },
            { label: "Present",     value: records.filter(r => r.status === "PRESENT").length, color: "text-emerald-400" },
            { label: "Absent",      value: records.filter(r => r.status === "ABSENT").length,  color: "text-red-400"     },
            { label: "Late",        value: records.filter(r => r.status === "LATE").length,    color: "text-amber-400"   },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-900 border border-white/5 rounded-2xl p-4 text-center">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-gray-500 text-[10px] mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Records */}
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
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Date", "AM In", "AM Out", "PM In", "PM Out", "Hours", "Status", "Remarks"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {records.map(r => (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-white text-xs font-medium whitespace-nowrap">{fmtDate(r.date)}</td>
                      <td className="px-4 py-3 text-gray-300 text-xs whitespace-nowrap">{fmt(r.amTimeIn)}</td>
                      <td className="px-4 py-3 text-gray-300 text-xs whitespace-nowrap">{fmt(r.amTimeOut)}</td>
                      <td className="px-4 py-3 text-gray-300 text-xs whitespace-nowrap">{fmt(r.pmTimeIn)}</td>
                      <td className="px-4 py-3 text-gray-300 text-xs whitespace-nowrap">{fmt(r.pmTimeOut)}</td>
                      <td className="px-4 py-3 text-gray-300 text-xs font-semibold whitespace-nowrap">{r.hoursWorked ? `${r.hoursWorked}h` : "—"}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{r.remarks ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-white/[0.04]">
              {records.map(r => (
                <div key={r.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-white text-xs font-semibold">{fmtDate(r.date)}</p>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-800/60 rounded-xl p-2.5 space-y-1">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Morning</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">In</span>
                        <span className="text-[10px] text-white font-medium">{fmt(r.amTimeIn)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">Out</span>
                        <span className="text-[10px] text-white font-medium">{fmt(r.amTimeOut)}</span>
                      </div>
                    </div>
                    <div className="bg-gray-800/60 rounded-xl p-2.5 space-y-1">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Afternoon</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">In</span>
                        <span className="text-[10px] text-white font-medium">{fmt(r.pmTimeIn)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">Out</span>
                        <span className="text-[10px] text-white font-medium">{fmt(r.pmTimeOut)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500">
                      Hours: <span className="text-white font-semibold">{r.hoursWorked ? `${r.hoursWorked}h` : "—"}</span>
                    </span>
                    {r.remarks && (
                      <span className="text-[10px] text-gray-500 truncate max-w-[60%] text-right">{r.remarks}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}