import {
  useGetAttendanceStatsQuery,
  useAmClockInMutation, useAmClockOutMutation,
  usePmClockInMutation, usePmClockOutMutation,
  useGetAttendanceQuery,
} from "../../redux/api/api";
import { useUser } from "../../auth/auth";
import { toast } from "react-toastify";
import { FaUsers, FaCheckCircle, FaTimesCircle, FaClock, FaSignInAlt, FaSignOutAlt, FaExclamationTriangle, FaFire, FaTrophy } from "react-icons/fa";
import type { AttendanceRecord } from "../../types/types";

const fmt = (d: string | null | undefined) => {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" });
};

const toISO = (d: Date) => d.toISOString().split("T")[0];

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

// ── Streak helpers ────────────────────────────────────────────────────────────
function computeStreak(records: AttendanceRecord[]) {
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
  const today  = toISO(new Date());

  let current = 0;
  let best    = 0;
  let temp    = 0;

  const asc = [...records].sort((a, b) => a.date.localeCompare(b.date));
  for (const r of asc) {
    if (r.status === "PRESENT") { temp++; if (temp > best) best = temp; }
    else temp = 0;
  }

  for (const r of sorted) {
    if (r.status === "PRESENT") current++;
    else if (r.date < today) break;
  }

  return { current, best };
}

// ── 30-day heatmap dot ────────────────────────────────────────────────────────
function HeatmapDot({ status }: { status?: string }) {
  const color =
    status === "PRESENT"  ? "bg-emerald-500" :
    status === "LATE"     ? "bg-amber-500"   :
    status === "ABSENT"   ? "bg-red-500/70"  :
    status === "HALF_DAY" ? "bg-purple-500"  :
    "bg-gray-700";
  return <div className={`w-3 h-3 rounded-sm ${color} transition-all`} title={status ?? "No record"} />;
}

export default function OverviewPage() {
  const user  = useUser();
  const admin = user?.role === "ADMIN";
  const today = toISO(new Date());

  const thirtyDaysAgo = toISO(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000));

  const { data: statsData }   = useGetAttendanceStatsQuery(undefined);
  const { data: myData }      = useGetAttendanceQuery(
    { userId: user?.id, dateFrom: today, dateTo: today },
    { skip: !user?.id }
  );
  const { data: historyData } = useGetAttendanceQuery(
    { userId: user?.id, dateFrom: thirtyDaysAgo, dateTo: today },
    { skip: !user?.id }
  );

  const [amClockIn,  { isLoading: amClockinIn  }] = useAmClockInMutation();
  const [amClockOut, { isLoading: amClockingOut }] = useAmClockOutMutation();
  const [pmClockIn,  { isLoading: pmClockingIn  }] = usePmClockInMutation();
  const [pmClockOut, { isLoading: pmClockingOut }] = usePmClockOutMutation();

  const stats          = statsData?.data;
  const todayRecord    = (myData?.records as AttendanceRecord[])?.[0];
  const historyRecords = (historyData?.records as AttendanceRecord[]) ?? [];

  const handle = async (fn: () => Promise<any>, successMsg: string) => {
    try {
      await fn();
      toast.success(successMsg);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Action failed");
    }
  };

  const now         = new Date();
  const hourNow     = now.getHours();
  const isPastNoon  = hourNow >= 12;
  const isPastAMOut = hourNow >= 12;
  const isPastPMOut = hourNow >= 17;

  const notifications: { id: string; msg: string; color: string; border: string; icon: string }[] = [];

  if (todayRecord) {
    if (todayRecord.amTimeIn && !todayRecord.amTimeOut && isPastAMOut) {
      notifications.push({
        id: "am-out",
        msg: "You forgot to clock out from your Morning session.",
        color: "text-amber-400", border: "border-amber-500/20", icon: "bg-amber-500/10",
      });
    }
    if (todayRecord.pmTimeIn && !todayRecord.pmTimeOut && isPastPMOut) {
      notifications.push({
        id: "pm-out",
        msg: "You forgot to clock out from your Afternoon session.",
        color: "text-amber-400", border: "border-amber-500/20", icon: "bg-amber-500/10",
      });
    }
    if (!todayRecord.amTimeIn && isPastNoon) {
      notifications.push({
        id: "am-missing",
        msg: "No Morning session recorded for today.",
        color: "text-red-400", border: "border-red-500/20", icon: "bg-red-500/10",
      });
    }
  } else if (isPastNoon) {
    notifications.push({
      id: "no-record",
      msg: "No attendance recorded for today. Please clock in or contact your admin.",
      color: "text-red-400", border: "border-red-500/20", icon: "bg-red-500/10",
    });
  }

  const { current: currentStreak, best: bestStreak } = computeStreak(historyRecords);

  const last30: { date: string; status?: string }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d   = toISO(new Date(Date.now() - i * 24 * 60 * 60 * 1000));
    const rec = historyRecords.find(r => r.date === d);
    last30.push({ date: d, status: rec?.status });
  }

  const statCards = admin ? [
    { label: "Total Employees", value: stats?.totalEmployees ?? 0, icon: FaUsers,       color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20"    },
    { label: "Present Today",   value: stats?.presentToday   ?? 0, icon: FaCheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { label: "Absent Today",    value: stats?.absentToday    ?? 0, icon: FaTimesCircle, color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20"     },
    { label: "Late Today",      value: stats?.lateToday      ?? 0, icon: FaClock,       color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20"   },
  ] : [];

  return (
    <div className="space-y-6">
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

      {/* Admin stats */}
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

      {/* Streak & Heatmap (employees only) */}
      {!admin && (
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Attendance Streak</h2>
            <span className="text-[10px] text-gray-600">Last 30 days</span>
          </div>
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
          <div>
            <div className="flex flex-wrap gap-1">
              {last30.map(({ date, status }) => (
                <HeatmapDot key={date} status={status} />
              ))}
            </div>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              {[
                { label: "Present",   color: "bg-emerald-500" },
                { label: "Late",      color: "bg-amber-500"   },
                { label: "Absent",    color: "bg-red-500/70"  },
                { label: "Half Day",  color: "bg-purple-500"  },
                { label: "No record", color: "bg-gray-700"    },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                  <span className="text-[9px] text-gray-500">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Today's Attendance */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Today's Attendance</h2>
          {todayRecord && <StatusBadge status={todayRecord.status} />}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* AM Session */}
          <div className="bg-gray-800/50 border border-white/5 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <p className="text-xs font-bold text-gray-300">Morning Session</p>
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
            <div className="grid grid-cols-2 gap-2">
              {!todayRecord?.amTimeIn ? (
                <button onClick={() => handle(() => amClockIn(undefined).unwrap(), "AM Clock In recorded!")}
                  disabled={amClockinIn}
                  className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-[11px] font-bold rounded-lg transition-all disabled:opacity-50">
                  <FaSignInAlt size={10} /> {amClockinIn ? "Recording..." : "AM Clock In"}
                </button>
              ) : !todayRecord?.amTimeOut ? (
                <button onClick={() => handle(() => amClockOut(undefined).unwrap(), "AM Clock Out recorded!")}
                  disabled={amClockingOut}
                  className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-[11px] font-bold rounded-lg transition-all disabled:opacity-50">
                  <FaSignOutAlt size={10} /> {amClockingOut ? "Recording..." : "AM Clock Out"}
                </button>
              ) : (
                <div className="col-span-2 flex items-center justify-center py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                  <p className="text-emerald-400 text-[11px] font-bold">✓ AM Complete</p>
                </div>
              )}
            </div>
          </div>

          {/* PM Session */}
          <div className="bg-gray-800/50 border border-white/5 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <p className="text-xs font-bold text-gray-300">Afternoon Session</p>
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
            <div className="grid grid-cols-2 gap-2">
              {!todayRecord?.pmTimeIn ? (
                <button onClick={() => handle(() => pmClockIn(undefined).unwrap(), "PM Clock In recorded!")}
                  disabled={pmClockingIn}
                  className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-[11px] font-bold rounded-lg transition-all disabled:opacity-50">
                  <FaSignInAlt size={10} /> {pmClockingIn ? "Recording..." : "PM Clock In"}
                </button>
              ) : !todayRecord?.pmTimeOut ? (
                <button onClick={() => handle(() => pmClockOut(undefined).unwrap(), "PM Clock Out recorded!")}
                  disabled={pmClockingOut}
                  className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-[11px] font-bold rounded-lg transition-all disabled:opacity-50">
                  <FaSignOutAlt size={10} /> {pmClockingOut ? "Recording..." : "PM Clock Out"}
                </button>
              ) : (
                <div className="col-span-2 flex items-center justify-center py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                  <p className="text-emerald-400 text-[11px] font-bold">✓ PM Complete</p>
                </div>
              )}
            </div>
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