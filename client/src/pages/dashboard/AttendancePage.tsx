import { useState, useRef, useEffect } from "react";
import {
  useGetAttendanceQuery, useManualEntryMutation,
  useDeleteAttendanceMutation, useGetUsersQuery,
} from "../../redux/api/api";
import { toast } from "react-toastify";
import { FaPlus, FaTimes, FaTrash, FaFilter, FaClock, FaCalendarAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import type { AttendanceRecord, User } from "../../types/types";

const fmt = (d: string | null | undefined) => {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" });
};

const fmtDate = (d: string) => {
  const datePart = d.split("T")[0];
  const [y, m, day] = datePart.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
};

// ── Custom Date Picker ────────────────────────────────────────────────────────
function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
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
      <div
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2 px-3 py-2 bg-gray-800 border border-white/8 rounded-xl cursor-pointer select-none transition-all ring-2 ${open ? "ring-blue-500/30" : "ring-transparent"} ${value ? "text-white" : "text-gray-500"}`}
      >
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

// ── Custom Time Picker ────────────────────────────────────────────────────────
// FIX: uses fixed positioning from trigger's bounding rect so the dropdown
// renders outside the scroll container and never shifts the modal layout.
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
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef  = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const openDropdown = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top:   rect.bottom + 6,
        left:  rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !dropdownRef.current?.contains(e.target as Node)
      ) setOpen(false);
    };
    const handleScroll = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownStyle(prev => ({ ...prev, top: rect.bottom + 6, left: rect.left }));
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  return (
    <div className="relative">
      <div
        ref={triggerRef}
        onClick={() => open ? setOpen(false) : openDropdown()}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 bg-gray-800 border border-white/8 rounded-xl cursor-pointer select-none transition-all ring-2 ${open ? accent.ring : "ring-transparent"} ${value ? "text-white" : "text-gray-500"}`}
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <FaClock size={11} className={value ? accent.col : "text-gray-600"} />
          <span className="text-xs font-medium tracking-wide">{display}</span>
        </div>
        {value && (
          <span role="button" onClick={e => { e.stopPropagation(); onChange(""); }}
            className="text-gray-600 hover:text-gray-400 transition-colors cursor-pointer shrink-0">
            <FaTimes size={9} />
          </span>
        )}
      </div>

      {/* Dropdown at fixed screen position — never affects scroll/layout */}
      {open && (
        <div ref={dropdownRef} style={dropdownStyle}
          className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
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

// ── Attendance Page ───────────────────────────────────────────────────────────
export default function AttendancePage() {
  const [showModal, setShowModal] = useState(false);
  const [filters,   setFilters]   = useState({ dateFrom: "", dateTo: "", userId: "", status: "" });

  const { data, isLoading } = useGetAttendanceQuery(filters);
  const { data: usersData } = useGetUsersQuery(undefined);
  const [deleteRecord]      = useDeleteAttendanceMutation();

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
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shrink-0">
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
          <DatePicker value={filters.dateFrom} onChange={v => setFilters(f => ({ ...f, dateFrom: v }))} placeholder="From date" />
          <DatePicker value={filters.dateTo}   onChange={v => setFilters(f => ({ ...f, dateTo: v }))}   placeholder="To date" />
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

      {/* Records */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Records</h2>
          <span className="text-[10px] text-gray-600">{records.length} entries</span>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-2">
            {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />)}
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500 text-sm">No records found</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Employee</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date</th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-blue-400/70 uppercase tracking-widest" colSpan={2}>Morning</th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-indigo-400/70 uppercase tracking-widest" colSpan={2}>Afternoon</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Hours</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                  <tr className="border-b border-white/5 bg-gray-800/30">
                    <th colSpan={2} />
                    <th className="px-4 py-2 text-[9px] font-semibold text-blue-400/50 uppercase tracking-widest">In</th>
                    <th className="px-4 py-2 text-[9px] font-semibold text-blue-400/50 uppercase tracking-widest">Out</th>
                    <th className="px-4 py-2 text-[9px] font-semibold text-indigo-400/50 uppercase tracking-widest">In</th>
                    <th className="px-4 py-2 text-[9px] font-semibold text-indigo-400/50 uppercase tracking-widest">Out</th>
                    <th colSpan={3} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {records.map(r => (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-white text-xs font-semibold">{r.user?.name}</p>
                        <p className="text-gray-500 text-[10px]">{r.user?.department ?? "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-xs whitespace-nowrap">{fmtDate(r.date)}</td>
                      <td className="px-4 py-3 text-blue-300/80 text-xs">{fmt(r.amTimeIn)}</td>
                      <td className="px-4 py-3 text-blue-300/80 text-xs">{fmt(r.amTimeOut)}</td>
                      <td className="px-4 py-3 text-indigo-300/80 text-xs">{fmt(r.pmTimeIn)}</td>
                      <td className="px-4 py-3 text-indigo-300/80 text-xs">{fmt(r.pmTimeOut)}</td>
                      <td className="px-4 py-3 text-gray-300 text-xs font-semibold">
                        {r.hoursWorked ? `${r.hoursWorked}h` : "—"}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
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
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-white/[0.04]">
              {records.map(r => (
                <div key={r.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-white text-sm font-semibold">{r.user?.name}</p>
                      <p className="text-gray-500 text-[10px]">{r.user?.department ?? "—"}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={r.status} />
                      <button onClick={() => handleDelete(r.id)}
                        className="w-7 h-7 rounded-lg bg-gray-800 border border-white/5 flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors">
                        <FaTrash size={10} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest">Date</p>
                      <p className="text-gray-300 text-xs font-medium mt-0.5">{fmtDate(r.date)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest">Total Hours</p>
                      <p className="text-white text-xs font-bold mt-0.5">{r.hoursWorked ? `${r.hoursWorked}h` : "—"}</p>
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
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showModal && <ManualEntryModal users={users} onClose={() => setShowModal(false)} />}
    </div>
  );
}

// ── Manual Entry Modal ────────────────────────────────────────────────────────
function ManualEntryModal({ users, onClose }: { users: User[]; onClose: () => void }) {
  const [manualEntry, { isLoading }] = useManualEntryMutation();
  const [form, setForm] = useState({
    userId: "", date: "",
    amTimeIn: "", amTimeOut: "",
    pmTimeIn: "", pmTimeOut: "",
    status: "PRESENT" as const,
    remarks: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await manualEntry({
        userId:    form.userId,
        date:      form.date,
        status:    form.status,
        remarks:   form.remarks || undefined,
        amTimeIn:  form.amTimeIn  ? `${form.date}T${form.amTimeIn}:00+08:00`  : undefined,
        amTimeOut: form.amTimeOut ? `${form.date}T${form.amTimeOut}:00+08:00` : undefined,
        pmTimeIn:  form.pmTimeIn  ? `${form.date}T${form.pmTimeIn}:00+08:00`  : undefined,
        pmTimeOut: form.pmTimeOut ? `${form.date}T${form.pmTimeOut}:00+08:00` : undefined,
      }).unwrap();
      toast.success("Attendance recorded");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to save");
    }
  };

  const selectCls = "w-full px-3 py-2 bg-gray-800 border border-white/8 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none";
  const labelCls  = "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-white">Manual Entry</h3>
            <p className="text-gray-500 text-xs mt-0.5">Record attendance for an employee</p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <FaTimes size={12} />
          </button>
        </div>

        {/* FIX: overflow-y-scroll always reserves scrollbar space → no layout shift when picker opens */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-scroll">
          <div>
            <label className={labelCls}>Employee</label>
            <select required value={form.userId}
              onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
              className={selectCls}>
              <option value="">Select employee</option>
              {users.filter(u => u.role === "EMPLOYEE").map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Date</label>
              <DatePicker value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} placeholder="Pick a date" />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                className={selectCls}>
                {["PRESENT","ABSENT","LATE","HALF_DAY"].map(s => (
                  <option key={s} value={s}>{s.replace("_"," ")}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Morning Session</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Time In</label>
                <TimePicker value={form.amTimeIn} onChange={v => setForm(f => ({ ...f, amTimeIn: v }))} accentColor="blue" />
              </div>
              <div>
                <label className={labelCls}>Time Out</label>
                <TimePicker value={form.amTimeOut} onChange={v => setForm(f => ({ ...f, amTimeOut: v }))} accentColor="blue" />
              </div>
            </div>
          </div>

          <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Afternoon Session</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Time In</label>
                <TimePicker value={form.pmTimeIn} onChange={v => setForm(f => ({ ...f, pmTimeIn: v }))} accentColor="indigo" />
              </div>
              <div>
                <label className={labelCls}>Time Out</label>
                <TimePicker value={form.pmTimeOut} onChange={v => setForm(f => ({ ...f, pmTimeOut: v }))} accentColor="indigo" />
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Remarks</label>
            <input value={form.remarks}
              onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
              placeholder="Optional"
              className={selectCls + " placeholder-gray-600"} />
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