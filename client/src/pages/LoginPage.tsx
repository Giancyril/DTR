import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "../redux/api/api";
import { setToken } from "../auth/auth";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function LoginPage() {
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await login(form).unwrap();
      setToken(res.data.token);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Ambient background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">



        {/* Card */}
        <div className="relative">
          <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-white/10 to-white/0 pointer-events-none" />
          <div className="bg-gray-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">

            <div className="mb-14 text-center">
              <h2 className="text-white text-2xl font-black tracking-tight">DTR System</h2>
              <p className="text-gray-500 text-sm mt-1.5 font-medium">Daily Time Record Management</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500 group-focus-within:text-blue-400 transition-colors">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder=" "
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/60 rounded-2xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500 group-focus-within:text-blue-400 transition-colors">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••••"
                    className="w-full pl-10 pr-12 py-3 bg-gray-800/60 rounded-2xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1"
                  >
                    {showPass ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative w-full py-3 rounded-2xl font-bold text-sm text-white overflow-hidden transition-all disabled:opacity-60 group"
                  style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
                >
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }} />
                  <span className="relative">
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        Signing in...
                      </span>
                    ) : "Sign In"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}