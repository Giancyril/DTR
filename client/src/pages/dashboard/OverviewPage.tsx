import { useState, useEffect, useRef } from "react";
import {
  useGetAttendanceStatsQuery,
  useAmClockInMutation, useAmClockOutMutation,
  usePmClockInMutation, usePmClockOutMutation,
  useGetAttendanceQuery,
  useGetUsersQuery,
} from "../../redux/api/api";
import { useUser } from "../../auth/auth";
import { toast } from "react-toastify";
import {
  FaUsers, FaCheckCircle, FaTimesCircle, FaClock,
  FaSignInAlt, FaSignOutAlt, FaExclamationTriangle,
  FaFire, FaTrophy, FaStopwatch, FaChevronDown,
} from "react-icons/fa";
import type { AttendanceRecord, User } from "../../types/types";

const fmt = (d: string | null | undefined) => {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" });
};

const toISO = (d: Date) => d.toISOString().split("T")[0];

// ── Late detection ────────────────────────────────────────────────────────────
const isLateClockIn = (timeStr: string | null | undefined): boolean => {
  if (!timeStr) return false;
  const ph = new Date(new Date(timeStr).toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  return ph.getHours() > 8 || (ph.getHours() === 8 && ph.getMinutes() > 0);
};

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    PRESENT:  "bg-blue-500/15 text-blue-400 border-blue-500/20",
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

// ── Live Timer Hook ───────────────────────────────────────────────────────────
function useLiveTimer(startTime: string | null | undefined, stopTime: string | null | undefined) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (startTime && !stopTime) {
      const start = new Date(startTime).getTime();
      const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
      tick();
      intervalRef.current = setInterval(tick, 1000);
    } else {
      setElapsed(0);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [startTime, stopTime]);

  if (!startTime || stopTime) return null;
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ── Live Timer Badge ──────────────────────────────────────────────────────────
function LiveTimerBadge({ startTime, stopTime }: { startTime?: string | null; stopTime?: string | null }) {
  const timer = useLiveTimer(startTime, stopTime);
  if (!timer) return null;
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg">
      <FaStopwatch size={9} className="text-blue-400 animate-pulse" />
      <span className="text-blue-400 text-[11px] font-mono font-bold">{timer}</span>
    </div>
  );
}

// ── Streak helpers ────────────────────────────────────────────────────────────
function computeStreak(records: AttendanceRecord[]) {
  const today = toISO(new Date());
  let current = 0, best = 0, temp = 0;

  const asc = [...records].sort((a, b) => a.date.localeCompare(b.date));
  for (const r of asc) {
    if (r.status === "PRESENT" || r.status === "LATE") { temp++; if (temp > best) best = temp; }
    else temp = 0;
  }

  const desc = [...records].sort((a, b) => b.date.localeCompare(a.date));
  for (const r of desc) {
    if (r.status === "PRESENT" || r.status === "LATE") current++;
    else if (r.date < today) break;
  }

  return { current, best };
}

// ── Heatmap Calendar ──────────────────────────────────────────────────────────
function HeatmapCalendar({ records, currentStreak, bestStreak, showStreaks = true }: {
  records: AttendanceRecord[];
  currentStreak: number;
  bestStreak: number;
  showStreaks?: boolean;
}) {
  const recordMap = new Map(records.map(r => [r.date.split("T")[0], r.status]));
  const today    = new Date();
  const todayISO = toISO(today);

  // 52 weeks ending today
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - today.getDay() - 51 * 7);
  const weeks: { date: string; status?: string }[][] = [];
  const cur = new Date(startDate);
  for (let w = 0; w < 52; w++) {
    const week: { date: string; status?: string }[] = [];
    for (let d = 0; d < 7; d++) {
      const iso = toISO(cur);
      week.push({ date: iso, status: recordMap.get(iso) });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const cellColor = (status?: string, date?: string) => {
    if (date && date > todayISO) return "bg-transparent";
    if (!status) return "bg-white/5";
    return ({
      PRESENT:  "bg-blue-500/80",
      LATE:     "bg-amber-500/80",
      ABSENT:   "bg-red-500/50",
      HALF_DAY: "bg-purple-500/80",
    } as Record<string, string>)[status] ?? "bg-white/5";
  };

  const allRecords   = records.filter(r => r.date.split("T")[0] <= todayISO);
  const presentCount = allRecords.filter(r => r.status === "PRESENT").length;
  const lateCount    = allRecords.filter(r => r.status === "LATE").length;
  const absentCount  = allRecords.filter(r => r.status === "ABSENT").length;

  return (
    <div className="space-y-4">
      {/* Streak cards — only for employee view */}
      {showStreaks && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800/50 border border-white/5 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
              <FaFire size={14} className="text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{currentStreak}</p>
              <p className="text-gray-500 text-[10px]">Current streak</p>
            </div>
          </div>
          <div className="bg-gray-800/50 border border-white/5 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
              <FaTrophy size={14} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{bestStreak}</p>
              <p className="text-gray-500 text-[10px]">Best streak</p>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="flex items-start gap-2">
        <div className="flex flex-col shrink-0 pt-5 gap-0">
          {DAY_LABELS.map((d, i) => (
            <div key={d} style={{ height: "14px" }}
              className={`text-[9px] text-gray-600 flex items-center ${i % 2 !== 0 ? "invisible" : ""}`}>
              {d}
            </div>
          ))}
        </div>
        <div className="flex-1 min-w-0">
          {/* Month labels */}
          <div className="flex mb-1">
            {weeks.map((week, i) => {
              const d = new Date(week[0].date);
              const label = d.getDate() <= 7 ? d.toLocaleDateString("en-PH", { month: "short" }) : "";
              return (
                <div key={i} className="flex-1 text-[9px] text-gray-600 text-center truncate">{label}</div>
              );
            })}
          </div>
          {/* Week columns */}
          <div className="flex gap-[2px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex-1 flex flex-col gap-[2px]">
                {week.map(({ date, status }) => (
                  <div key={date}
                    title={`${date}${status ? ` — ${status.replace("_", " ")}` : " — No record"}`}
                    className={`w-full aspect-square rounded-[2px] ${cellColor(status, date)} transition-opacity hover:opacity-70`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stat pills */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Present", val: presentCount, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
          { label: "Late",    val: lateCount,    color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20"    },
          { label: "Absent",  val: absentCount,  color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20"        },
        ].map(({ label, val, color, bg }) => (
          <div key={label} className={`${bg} border rounded-xl p-3 text-center`}>
            <p className={`text-lg font-bold ${color}`}>{val}</p>
            <p className="text-gray-500 text-[10px] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { label: "Present",   color: "bg-blue-500/80" },
          { label: "Late",      color: "bg-amber-500/80"   },
          { label: "Absent",    color: "bg-red-500/50"     },
          { label: "Half day",  color: "bg-purple-500/80"  },
          { label: "No record", color: "bg-white/5"        },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-[2px] ${color}`} />
            <span className="text-[9px] text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Admin Heatmap Panel ───────────────────────────────────────────────────────
function AdminHeatmapPanel() {
  const { data: usersData } = useGetUsersQuery(undefined);
  const users = ((usersData?.data as User[]) ?? []).filter(u => u.role === "EMPLOYEE");

  const [selectedId, setSelectedId] = useState<string>("");

  const yearAgo = toISO(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000));
  const today   = toISO(new Date());

  const { data: empData, isFetching } = useGetAttendanceQuery(
    { userId: selectedId, dateFrom: yearAgo, dateTo: today },
    { skip: !selectedId }
  );

  const empRecords = (empData?.records as AttendanceRecord[]) ?? [];
  const { current, best } = computeStreak(empRecords);
  const selectedUser = users.find(u => u.id === selectedId);

  return (
    <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Employee Attendance Heatmap</h2>
          {selectedUser && (
            <p className="text-gray-500 text-[10px] mt-0.5">{selectedUser.name}</p>
          )}
        </div>
        {/* Employee dropdown */}
        <div className="relative">
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 bg-gray-800 border border-white/8 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
          >
            <option value="">Select employee</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <FaChevronDown size={9} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {!selectedId ? (
        <div className="py-10 text-center">
          <FaUsers size={24} className="text-gray-700 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Select an employee to view their attendance heatmap</p>
        </div>
      ) : isFetching ? (
        <div className="space-y-2 py-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <HeatmapCalendar
          records={empRecords}
          currentStreak={current}
          bestStreak={best}
          showStreaks={true}
        />
      )}
    </div>
  );
}

// ── Main Overview Page ────────────────────────────────────────────────────────
export default function OverviewPage() {
  const user  = useUser();
  const admin = user?.role === "ADMIN";
  const today = toISO(new Date());

  const yearAgo = toISO(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000));

  const { data: statsData } = useGetAttendanceStatsQuery(undefined);
  const { data: myData }    = useGetAttendanceQuery(
    { userId: user?.id, dateFrom: today, dateTo: today },
    { skip: !user?.id }
  );
  const { data: historyData } = useGetAttendanceQuery(
    { userId: user?.id, dateFrom: yearAgo, dateTo: today },
    { skip: !user?.id || admin }
  );

  const [amClockIn,  { isLoading: amClockinIn   }] = useAmClockInMutation();
  const [amClockOut, { isLoading: amClockingOut  }] = useAmClockOutMutation();
  const [pmClockIn,  { isLoading: pmClockingIn   }] = usePmClockInMutation();
  const [pmClockOut, { isLoading: pmClockingOut  }] = usePmClockOutMutation();

  const stats          = statsData?.data;
  const todayRecord    = (myData?.records as AttendanceRecord[])?.[0];
  const historyRecords = (historyData?.records as AttendanceRecord[]) ?? [];

  const handle = async (fn: () => Promise<any>, successMsg: string) => {
    try { await fn(); toast.success(successMsg); }
    catch (err: any) { toast.error(err?.data?.message ?? "Action failed"); }
  };

  const now         = new Date();
  const hourNow     = now.getHours();
  const isPastNoon  = hourNow >= 12;
  const isPastPMOut = hourNow >= 17;
  const showLateBadge = isLateClockIn(todayRecord?.amTimeIn);

  const notifications: { id: string; msg: string; color: string; border: string; icon: string }[] = [];
  if (todayRecord) {
    if (todayRecord.amTimeIn && !todayRecord.amTimeOut && isPastNoon)
      notifications.push({ id: "am-out",     msg: "You forgot to clock out from your Morning session.",   color: "text-amber-400", border: "border-amber-500/20", icon: "bg-amber-500/10" });
    if (todayRecord.pmTimeIn && !todayRecord.pmTimeOut && isPastPMOut)
      notifications.push({ id: "pm-out",     msg: "You forgot to clock out from your Afternoon session.", color: "text-amber-400", border: "border-amber-500/20", icon: "bg-amber-500/10" });
    if (!todayRecord.amTimeIn && isPastNoon)
      notifications.push({ id: "am-missing", msg: "No Morning session recorded for today.",               color: "text-red-400",   border: "border-red-500/20",   icon: "bg-red-500/10"   });
  } else if (isPastNoon) {
    notifications.push({ id: "no-record", msg: "No attendance recorded for today. Please clock in or contact your admin.", color: "text-red-400", border: "border-red-500/20", icon: "bg-red-500/10" });
  }

  const { current: currentStreak, best: bestStreak } = computeStreak(historyRecords);

  const statCards = admin ? [
    { label: "Total Employees", value: stats?.totalEmployees ?? 0, icon: FaUsers,       color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20"    },
    { label: "Present Today",   value: stats?.presentToday   ?? 0, icon: FaCheckCircle, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { label: "Absent Today",    value: stats?.absentToday    ?? 0, icon: FaTimesCircle, color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20"     },
    { label: "Late Today",      value: stats?.lateToday      ?? 0, icon: FaClock,       color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20"   },
  ] : [];

  return (
    <div className="space-y-6">

      {/* Greeting */}
      <div>
        <h1 className="text-white text-xl font-bold tracking-tight">
          Good {hourNow < 12 ? "morning" : hourNow < 18 ? "afternoon" : "evening"},{" "}
          {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-gray-500 text-xs mt-0.5">
          {now.toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Notifications */}
      {!admin && notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${n.border} bg-gray-900`}>
              <div className={`w-7 h-7 rounded-lg ${n.icon} flex items-center justify-center shrink-0 mt-0.5`}>
                <FaExclamationTriangle size={11} className={n.color} />
              </div>
              <p className={`text-xs font-medium ${n.color}`}>{n.msg}</p>
            </div>
          ))}
        </div>
      )}

      {/* Admin stat cards */}
      {admin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map(({ label, value, icon: Icon, color, bg, border }) => (
            <div key={label} className="bg-gray-900 border border-white/5 rounded-2xl p-4">
              <div className={`w-8 h-8 rounded-xl ${bg} border ${border} flex items-center justify-center mb-3`}>
                <Icon size={14} className={color} />
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Admin heatmap with employee dropdown */}
      {admin && <AdminHeatmapPanel />}

      {/* Employee heatmap */}
      {!admin && (
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Attendance Overview</h2>
            <span className="text-[10px] text-gray-600">Last 52 weeks</span>
          </div>
          <HeatmapCalendar
            records={historyRecords}
            currentStreak={currentStreak}
            bestStreak={bestStreak}
            showStreaks={true}
          />
        </div>
      )}

      {/* Today's Attendance */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Today's Attendance</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {showLateBadge && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-amber-500/15 text-amber-400 border-amber-500/20">
                ⚠ LATE ARRIVAL
              </span>
            )}
            {todayRecord && <StatusBadge status={todayRecord.status} />}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* AM Session */}
          <div className="bg-gray-800/50 border border-white/5 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <p className="text-xs font-bold text-gray-300">Morning Session</p>
              </div>
              <LiveTimerBadge startTime={todayRecord?.amTimeIn} stopTime={todayRecord?.amTimeOut} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-800 rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">AM In</p>
                <p className="text-white text-sm font-bold mt-0.5">{fmt(todayRecord?.amTimeIn)}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">AM Out</p>
                <p className="text-white text-sm font-bold mt-0.5">{fmt(todayRecord?.amTimeOut)}</p>
              </div>
            </div>
            {!todayRecord?.amTimeIn ? (
              <button onClick={() => handle(() => amClockIn(undefined).unwrap(), "AM Clock In recorded!")}
                disabled={amClockinIn}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-[11px] font-bold rounded-lg transition-all disabled:opacity-50">
                <FaSignInAlt size={10} /> {amClockinIn ? "Recording..." : "AM Clock In"}
              </button>
            ) : !todayRecord?.amTimeOut ? (
              <button onClick={() => handle(() => amClockOut(undefined).unwrap(), "AM Clock Out recorded!")}
                disabled={amClockingOut}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-[11px] font-bold rounded-lg transition-all disabled:opacity-50">
                <FaSignOutAlt size={10} /> {amClockingOut ? "Recording..." : "AM Clock Out"}
              </button>
            ) : (
              <div className="flex items-center justify-center py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                <p className="text-emerald-400 text-[11px] font-bold">✓ AM Complete</p>
              </div>
            )}
          </div>

          {/* PM Session */}
          <div className="bg-gray-800/50 border border-white/5 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <p className="text-xs font-bold text-gray-300">Afternoon Session</p>
              </div>
              <LiveTimerBadge startTime={todayRecord?.pmTimeIn} stopTime={todayRecord?.pmTimeOut} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-800 rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">PM In</p>
                <p className="text-white text-sm font-bold mt-0.5">{fmt(todayRecord?.pmTimeIn)}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">PM Out</p>
                <p className="text-white text-sm font-bold mt-0.5">{fmt(todayRecord?.pmTimeOut)}</p>
              </div>
            </div>
            {!todayRecord?.pmTimeIn ? (
              <button onClick={() => handle(() => pmClockIn(undefined).unwrap(), "PM Clock In recorded!")}
                disabled={pmClockingIn}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-[11px] font-bold rounded-lg transition-all disabled:opacity-50">
                <FaSignInAlt size={10} /> {pmClockingIn ? "Recording..." : "PM Clock In"}
              </button>
            ) : !todayRecord?.pmTimeOut ? (
              <button onClick={() => handle(() => pmClockOut(undefined).unwrap(), "PM Clock Out recorded!")}
                disabled={pmClockingOut}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-[11px] font-bold rounded-lg transition-all disabled:opacity-50">
                <FaSignOutAlt size={10} /> {pmClockingOut ? "Recording..." : "PM Clock Out"}
              </button>
            ) : (
              <div className="flex items-center justify-center py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                <p className="text-emerald-400 text-[11px] font-bold">✓ PM Complete</p>
              </div>
            )}
          </div>
        </div>

        {todayRecord?.hoursWorked ? (
          <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 rounded-xl border border-white/5">
            <p className="text-gray-400 text-xs">Total Hours Today</p>
            <p className="text-white text-sm font-bold">{todayRecord.hoursWorked}h</p>
          </div>
        ) : null}

        {todayRecord?.remarks && (
          <p className="text-gray-500 text-xs">{todayRecord.remarks}</p>
        )}
      </div>
    </div>
  );
}