import {
  useGetAttendanceStatsQuery,
  useAmClockInMutation, useAmClockOutMutation,
  usePmClockInMutation, usePmClockOutMutation,
  useGetAttendanceQuery,
} from "../../redux/api/api";
import { useUser, isAdmin } from "../../auth/auth";
import { toast } from "react-toastify";
import { FaUsers, FaCheckCircle, FaTimesCircle, FaClock, FaSignInAlt, FaSignOutAlt } from "react-icons/fa";
import type { AttendanceRecord } from "../../types/types";

const fmt = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }) : "—";

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

export default function OverviewPage() {
  const user  = useUser();
  const admin = isAdmin();
  const today = new Date().toISOString().split("T")[0];

  const { data: statsData } = useGetAttendanceStatsQuery(undefined);
  const { data: myData }    = useGetAttendanceQuery(
    { userId: user?.id, dateFrom: today, dateTo: today },
    { skip: !user?.id }
  );

  const [amClockIn,  { isLoading: amClockinIn   }] = useAmClockInMutation();
  const [amClockOut, { isLoading: amClockingOut  }] = useAmClockOutMutation();
  const [pmClockIn,  { isLoading: pmClockingIn   }] = usePmClockInMutation();
  const [pmClockOut, { isLoading: pmClockingOut  }] = usePmClockOutMutation();

  const stats       = statsData?.data;
  const todayRecord = (myData?.records as AttendanceRecord[])?.[0];

  const handle = async (fn: () => Promise<any>, successMsg: string) => {
    try {
      await fn();
      toast.success(successMsg);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Action failed");
    }
  };

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
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},{" "}
          {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 text-xs mt-0.5">
          {new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

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
              <div className="w-2 h-2 rounded-full bg-amber-400" />
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
                  className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-[11px] font-bold rounded-lg transition-all disabled:opacity-50">
                  <FaSignInAlt size={10} /> {amClockinIn ? "Recording..." : "AM Clock In"}
                </button>
              ) : !todayRecord?.amTimeOut ? (
                <button onClick={() => handle(() => amClockOut(undefined).unwrap(), "AM Clock Out recorded!")}
                  disabled={amClockingOut}
                  className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 text-[11px] font-bold rounded-lg transition-all disabled:opacity-50">
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

        {/* Total hours */}
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