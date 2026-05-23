import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import API_URL from "../config";
import { KeyRound, Lock, ArrowRight } from "lucide-react";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);

    try {
      if (token) {
        await axios.post(API_URL + "/api/reset-with-token", {
          token,
          new_password: newPassword,
        });
      } else {
        toast.error("No reset token provided");
        setLoading(false);
        return;
      }
      toast.success("Password reset successful");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.error || "Reset failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 dark:bg-[linear-gradient(-45deg,#0f172a,#1e1b4b,#1e3a8a,#3730a3)] overflow-hidden p-4">
      <div className="relative w-full max-w-md bg-white/80 dark:bg-white/5 backdrop-blur-2xl border border-white/50 dark:border-white/[0.08] rounded-3xl shadow-xl dark:shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-100 dark:bg-white/10 rounded-2xl mb-4">
            <KeyRound size={26} className="text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reset Password</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {token ? "Enter your new password" : "Invalid reset link"}
          </p>
        </div>

        {token ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/70 dark:bg-white/5 border border-gray-300 dark:border-white/10 placeholder-gray-400 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/50"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3.5 rounded-xl hover:shadow-lg hover:shadow-purple-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "Resetting..." : (
                <span className="flex items-center gap-2">Reset Password <ArrowRight size={17} /></span>
              )}
            </button>
          </form>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Please use the reset link from your approved request.
          </p>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;