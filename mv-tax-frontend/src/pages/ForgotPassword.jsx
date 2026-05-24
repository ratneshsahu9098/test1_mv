import { motion } from "framer-motion";
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import API_URL from "../config";
import { Lock, ArrowRight, MailCheck, User } from "lucide-react";

function ForgotPassword() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(API_URL + "/api/forgot_password", { username });
      setSent(true);
      toast.success("Reset request sent to admin");
    } catch {
      toast.error("User not found");
    }
    setLoading(false);
  };

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 dark:bg-[linear-gradient(-45deg,#0f172a,#1e1b4b,#1e3a8a,#3730a3)] dark:bg-[length:400%_400%] dark:animate-[gradient_15s_ease_infinite] overflow-hidden p-4">
      <div className="absolute -top-40 -left-40 w-[50rem] h-[50rem] bg-cyan-500/10 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
      <div className="absolute -bottom-40 -right-40 w-[45rem] h-[45rem] bg-purple-600/20 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite_2s]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] bg-blue-600/5 rounded-full blur-3xl" />
      <div className="absolute inset-0 bg-black/10 dark:bg-black/30" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="relative overflow-hidden bg-white/80 dark:bg-white/5 backdrop-blur-2xl border border-white/50 dark:border-white/[0.08] rounded-3xl shadow-xl dark:shadow-2xl p-8 transition-all duration-500">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 rounded-full blur-3xl" />

          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-14 h-14 bg-purple-100 dark:bg-white/10 rounded-2xl mb-4 mx-auto"
            >
              <Lock size={26} className="text-purple-600 dark:text-purple-400" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Forgot Password</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {sent ? "Request submitted" : "Enter your username"}
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5">
                <MailCheck size={32} className="mx-auto mb-3 text-green-400" />
                <p className="text-gray-900 dark:text-gray-200 font-medium">Request Sent to Admin</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Once approved, you'll receive a reset link.
                </p>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 rounded-xl hover:shadow-lg hover:shadow-purple-500/20 active:scale-[0.98] transition-all"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative group">
                <User size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 dark:text-gray-500 dark:group-focus-within:text-purple-400 transition-colors duration-300" />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/70 dark:bg-white/5 border border-gray-300 dark:border-white/10 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3.5 rounded-xl hover:shadow-lg hover:shadow-purple-500/20 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2.5">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">Send Reset Request <ArrowRight size={17} /></span>
                )}
              </button>
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
                Remember your password?{" "}
                <Link to="/login" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">Login</Link>
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default ForgotPassword;
