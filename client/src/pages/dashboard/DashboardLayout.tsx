import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useUser, signOut } from "../../auth/auth";
import { toast } from "react-toastify";
import {
  FaHome, FaClock, FaClipboardList, FaUsers, FaCog,
  FaBars, FaTimes, FaSignOutAlt, FaChevronDown, FaFileAlt,
} from "react-icons/fa";

const adminNav = [
  { to: "/dashboard",     label: "Overview",    icon: FaHome },
  { to: "/attendance",    label: "Attendance",  icon: FaClipboardList },
  { to: "/dtr",           label: "DTR Summary", icon: FaFileAlt },
  { to: "/employees",     label: "Employees",   icon: FaUsers },
  { to: "/settings",      label: "Settings",    icon: FaCog },
];

const employeeNav = [
  { to: "/dashboard",     label: "Overview",      icon: FaHome },
  { to: "/my-attendance", label: "My Attendance", icon: FaClipboardList },
  { to: "/dtr",           label: "My DTR",        icon: FaFileAlt },
  { to: "/settings",      label: "Settings",      icon: FaCog },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user     = useUser();
  const admin    = user?.role === "ADMIN";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const nav = admin ? adminNav : employeeNav;

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("#profile-menu")) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  const handleSignOut = () => {
    if (!confirm("Are you sure you want to sign out?")) return;
    signOut(navigate);
    toast.info("Signed out successfully");
  };

  const initial = user?.name?.charAt(0).toUpperCase() ?? "U";

  return (
    <div className="min-h-screen bg-gray-950 flex">

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-gray-900 border-r border-white/5 fixed inset-y-0 left-0 z-30">
        <SidebarContent nav={nav} onNavigate={() => {}} />
      </aside>

      {/* Mobile drawer */}
      <div className={`lg:hidden fixed inset-0 z-50 flex transition-visibility duration-300 ${sidebarOpen ? "visible" : "invisible"}`}>
        <div
          className={`absolute inset-0 bg-black/70 transition-opacity duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setSidebarOpen(false)}
        />
        <aside className={`relative z-10 w-64 max-w-[82vw] h-full bg-gray-900 border-r border-white/5 flex flex-col shadow-2xl transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white"
          >
            <FaTimes size={16} />
          </button>
          <SidebarContent nav={nav} onNavigate={() => setSidebarOpen(false)} />
        </aside>
      </div>

      {/* Main */}
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen min-w-0">

        {/* Topbar */}
        <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-white/5 px-4 lg:px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white"
          >
            <FaBars size={13} />
          </button>

          <div className="flex-1" />

          <div id="profile-menu" className="relative">
            <button
              onClick={() => setProfileOpen(p => !p)}
              className="flex items-center gap-2.5 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/10">
                <span className="text-white text-[11px] font-black">{initial}</span>
              </div>
              <div className="hidden sm:flex flex-col items-start min-w-0">
                <span className="text-white text-xs font-bold truncate max-w-[120px]">{user?.name}</span>
                <span className="text-gray-500 text-[10px] truncate max-w-[120px]">{user?.role}</span>
              </div>
              <FaChevronDown size={9} className={`hidden sm:block text-gray-500 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-11 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
                  <p className="text-gray-500 text-[10px] mt-0.5 truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  <NavLink to="/settings" onClick={() => setProfileOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 text-xs">
                    <FaCog size={11} className="text-gray-400 shrink-0" /> Settings
                  </NavLink>
                  <div className="mx-3 my-1 border-t border-white/5" />
                  <button
                    onClick={() => { setProfileOpen(false); handleSignOut(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-red-400 hover:bg-red-500/10 text-xs"
                  >
                    <FaSignOutAlt size={11} className="text-red-400 shrink-0" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-6 py-6 min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ nav, onNavigate }: { nav: typeof adminNav; onNavigate: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 border-b border-white/5 shrink-0 h-14 flex items-center">
        <div>
          <p className="text-white text-sm font-bold tracking-wide">DTR System</p>
          <p className="text-gray-400 text-[9px] uppercase tracking-widest">Daily Time Record</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                isActive
                  ? "bg-blue-600/15 text-blue-400 border-blue-500/20"
                  : "text-gray-400 border-transparent hover:text-white hover:bg-white/5"
              }`
            }
          >
            <Icon size={14} className="shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}