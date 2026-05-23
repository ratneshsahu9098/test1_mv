import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import axios from "axios";
import API_URL from "../config";
import { User, Mail, Phone, Lock, Eye, EyeOff, Save, Shield, Check } from "lucide-react";

const strengthConfig = [
  { label: "Weak", color: "bg-red-500", width: "w-1/4", score: 1 },
  { label: "Fair", color: "bg-orange-500", width: "w-2/4", score: 2 },
  { label: "Good", color: "bg-yellow-500", width: "w-3/4", score: 3 },
  { label: "Strong", color: "bg-green-500", width: "w-full", score: 4 },
];

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

function Settings() {
  const [username, setUsername] = useState(
    localStorage.getItem("username") || ""
  );
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState(
    localStorage.getItem("email") || ""
  );
  const [phone, setPhone] = useState(
    localStorage.getItem("phone") || ""
  );
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const role = localStorage.getItem("role");
  const subStatus = localStorage.getItem("subscription_status");
  const subExpiry = localStorage.getItem("subscription_expiry");

  const passwordStrength = getPasswordStrength(password);
  const strength = strengthConfig.find((s) => s.score === passwordStrength) || strengthConfig[0];

  const updateProfile = async () => {
    if (phone && !/^\d{10}$/.test(phone)) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        API_URL + "/api/update_profile",
        { username, email, phone, password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.setItem("username", username);
      localStorage.setItem("email", email);
      localStorage.setItem("phone", phone);
      toast.success("Profile updated");
      setPassword("");
    } catch (error) {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const infoCards = [
    { label: "Role", value: role || "-", color: "text-purple-400" },
    { label: "Subscription", value: subStatus || "free", color: subStatus === "active" ? "text-green-400" : "text-gray-400" },
  ];
  if (subExpiry) infoCards.push({ label: "Expiry", value: subExpiry, color: "text-gray-400" });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2"
        >
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-500/10">
                <User size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Update Profile</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account details</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <User size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 dark:text-gray-500 dark:group-focus-within:text-blue-400 transition-colors duration-300" />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={localStorage.getItem("username") === "admin"}
                  className="w-full py-3.5 pl-11 pr-4 bg-white/70 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 disabled:opacity-50"
                />
              </div>

              <div className="relative group">
                <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 dark:text-gray-500 dark:group-focus-within:text-blue-400 transition-colors duration-300" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-3.5 pl-11 pr-4 bg-white/70 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                />
              </div>

              <div className="relative group">
                <Phone size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 dark:text-gray-500 dark:group-focus-within:text-blue-400 transition-colors duration-300" />
                <input
                  type="text"
                  placeholder="Mobile Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  maxLength={10}
                  className="w-full py-3.5 pl-11 pr-4 bg-white/70 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <div className="relative group">
                  <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 dark:text-gray-500 dark:group-focus-within:text-blue-400 transition-colors duration-300" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New Password (leave blank to keep current)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full py-3.5 pl-11 pr-11 bg-white/70 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                {password.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-1.5"
                  >
                    <div className="h-1.5 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: strength.width }}
                        className={`h-full rounded-full ${strength.color} transition-all duration-500`}
                      />
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Password strength: <span className={strength.color.replace("bg-", "text-")}>{strength.label}</span>
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 dark:text-gray-500">
                      <span className={password.length >= 6 ? "text-green-400" : ""}>
                        <Check size={10} className="inline mr-0.5" /> 6+ characters
                      </span>
                      <span className={/[A-Z]/.test(password) ? "text-green-400" : ""}>
                        <Check size={10} className="inline mr-0.5" /> Uppercase
                      </span>
                      <span className={/[0-9]/.test(password) ? "text-green-400" : ""}>
                        <Check size={10} className="inline mr-0.5" /> Number
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>

              <button
                onClick={updateProfile}
                disabled={saving}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 rounded-xl hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {saving ? (
                  <span className="flex items-center gap-2.5">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save size={17} /> Save Changes
                  </span>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-6"
        >
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-500/10">
                <Shield size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Account Info</h3>
            </div>
            <div className="space-y-4">
              {infoCards.map((card) => (
                <div key={card.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{card.label}</span>
                  <span className={`text-sm font-semibold ${card.color} capitalize`}>{card.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Settings;
