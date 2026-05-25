import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { User, Lock, Eye, EyeOff, ArrowRight, Car } from "lucide-react";
import axios from "axios";
import API_URL from "../config";

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("remembered_user");
    if (saved) setUsername(saved);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(API_URL + "/api/login", {
        username, password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("subscription_status", response.data.subscription_status);
      localStorage.setItem("subscription_expiry", response.data.subscription_expiry);
      localStorage.setItem("username", response.data.username);
      localStorage.setItem("role", response.data.role);
      localStorage.setItem("email", response.data.email || "");
      localStorage.setItem("phone", response.data.phone || "");

      toast.success("Login successful");
      navigate("/");
    } catch (error) {
      const msg = error.response?.data?.error || "Login failed. Check your connection.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/");
  }, [navigate]);

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 dark:bg-[linear-gradient(-45deg,#0f172a,#1e1b4b,#1e3a8a,#3730a3)] dark:bg-[length:400%_400%] dark:animate-[gradient_15s_ease_infinite] overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[50rem] h-[50rem] bg-cyan-500/10 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
      <div className="absolute -bottom-40 -right-40 w-[45rem] h-[45rem] bg-purple-600/20 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite_2s]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] bg-blue-600/5 rounded-full blur-3xl" />
      <div className="absolute inset-0 bg-black/10 dark:bg-black/30" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl mb-5 border border-white/40 dark:border-white/20 shadow-lg"
          >
            <Car size={28} className="text-purple-600 dark:text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">MV Tax</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">Vehicle Tax Management Platform</p>
        </div>

        <div className="relative overflow-hidden bg-white/80 dark:bg-white/5 backdrop-blur-2xl border border-white/50 dark:border-white/[0.08] rounded-3xl shadow-xl dark:shadow-2xl p-8 transition-all duration-500">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 rounded-full blur-3xl" />

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Welcome back</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-7">Sign in to your account</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-300 p-3.5 rounded-xl mb-6 text-sm flex items-center gap-2.5"
            >
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500/30 flex items-center justify-center text-xs font-bold">!</span>
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative group">
              <User size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 dark:text-gray-500 dark:group-focus-within:text-purple-400 transition-colors duration-300" />
              <input
                type="text"
                autoComplete="username"
                placeholder="Username or Mobile"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/70 dark:bg-white/5 border border-gray-300 dark:border-white/10 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
                required
              />
            </div>

            <div className="relative group">
              <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 dark:text-gray-500 dark:group-focus-within:text-purple-400 transition-colors duration-300" />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3.5 pl-11 pr-11 rounded-xl bg-white/70 dark:bg-white/5 border border-gray-300 dark:border-white/10 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center gap-2 text-gray-500 dark:text-gray-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 dark:border-white/20 bg-white/70 dark:bg-white/5 accent-purple-600"
                  onChange={(e) => {
                    if (!e.target.checked) localStorage.removeItem("remembered_user");
                    else localStorage.setItem("remembered_user", username);
                  }}
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-purple-600 dark:text-purple-400/80 hover:text-purple-500 dark:hover:text-purple-300 transition-colors text-sm font-medium">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3.5 rounded-xl hover:shadow-lg hover:shadow-purple-500/30 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2.5">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In <ArrowRight size={17} />
                </span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/[0.06] text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Don't have an account?{" "}
              <Link to="/register" className="text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 font-semibold transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
