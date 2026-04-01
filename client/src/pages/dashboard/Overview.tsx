import { useGetAttendanceStatsQuery, useClockInMutation, useClockOutMutation, useGetAttendanceQuery } from "../../redux/api/api";
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
  const user    = useUser();
  const admin   = isAdmin();
  const today   = new Date().toISOString().split("T")[0];

  const { data: statsData } = useGetAttendanceStatsQuery(undefined);
  const { data: myData }    = useGetAttendanceQuery({ userId: user?.id, dateFrom: today, dateTo: today }, { skip: !user?.id });

  const [clockIn,  { isLoading: clockingIn  }] = useClockInMutation();
  const [clockOut, { isLoading: clockingOut }] = useClockOutMutation();

  const stats   = statsData?.data;
  const todayRecord = (myData?.records as AttendanceRecord[])?.[0];

  const handleClockIn = async () => {
    try {
      await clockIn(undefined).unwrap();
      toast.success("Clocked in successfully!");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to clock in");
    }
  };

  const handleClockOut = async () => {
    try {
      await clockOut(undefined).unwrap();
      toast.success("Clocked out successfully!");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to clock out");
    }
  };

  const statCards = admin ? [
    { label: "Total Employees", value: stats?.totalEmployees ?? 0, icon: FaUsers,        color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20"    },
    { label: "Present Today",   value: stats?.presentToday   ?? 0, icon: FaCheckCircle,  color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { label: "Absent Today",    value: stats?.absentToday    ?? 0, icon: FaTimesCircle,  color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20"     },
    { label: "Late Today",      value: stats?.lateToday      ?? 0, icon: FaClock,        color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20"   },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-xl font-bold tracking-tight">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {user?.name?.split(" ")[0]} 👋
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

      {/* Clock in/out card */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-5">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Today's Attendance</h2>

        {todayRecord ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Time In",  value: fmt(todayRecord.timeIn)  },
                { label: "Time Out", value: fmt(todayRecord.timeOut) },
                { label: "Hours",    value: todayRecord.hoursWorked ? `${todayRecord.hoursWorked}h` : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</p>
                  <p className="text-white text-sm font-bold mt-1">{value}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={todayRecord.status} />
              {todayRecord.remarks && (
                <span className="text-gray-500 text-xs">{todayRecord.remarks}</span>
              )}
            </div>
            {todayRecord.timeIn && !todayRecord.timeOut && (
              <button
                onClick={handleClockOut}
                disabled={clockingOut}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600/15 hover:bg-red-600/25 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
              >
                <FaSignOutAlt size={11} /> {clockingOut ? "Clocking out..." : "Clock Out"}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-gray-500 text-sm">You haven't clocked in yet today.</p>
            <button
              onClick={handleClockIn}
              disabled={clockingIn}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl transition-all disabled:opacity-50 max-w-xs"
            >
              <FaSignInAlt size={11} /> {clockingIn ? "Clocking in..." : "Clock In"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}