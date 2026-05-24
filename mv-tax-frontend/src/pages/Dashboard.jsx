import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import API_URL from "../config";
import Sidebar from "../components/Sidebar";
import { motion } from "framer-motion";
import { RefreshCw, Car, AlertTriangle, Clock, CheckCircle, Users, UserCheck, UserX, TrendingUp, Calendar, Activity } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = {
  expired: "#ef4444",
  expiring: "#f97316",
  active: "#22c55e",
};

const PIE_COLORS = ["#ef4444", "#f97316", "#22c55e"];

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");
  const isAdmin = role === "admin";

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Session expired. Please login again.");
        setLoading(false);
        return;
      }
      const { data } = await axios.get(
        `${API_URL}/api/dashboard_stats?_=${Date.now()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(data);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.msg || err.message || "Failed to load dashboard";
      if (msg === "Token has expired") {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("username");
        window.location.href = "/login";
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const vehicleChartData = useMemo(() => stats ? [
    { name: "Expired", value: stats.expired, color: COLORS.expired },
    { name: "Expiring Soon", value: stats.expiring_soon, color: COLORS.expiring },
    { name: "Active", value: stats.active_vehicles, color: COLORS.active },
  ] : [], [stats]);

  const barChartData = useMemo(() => stats ? [
    { name: "Expired", count: stats.expired, fill: COLORS.expired },
    { name: "Expiring Soon", count: stats.expiring_soon, fill: COLORS.expiring },
    { name: "Active", count: stats.active_vehicles, fill: COLORS.active },
  ] : [], [stats]);

  const cards = useMemo(() => [
    { title: "Total Vehicles", value: stats?.total_vehicles ?? "-", color: "from-blue-600 to-blue-800", icon: Car, delay: 0 },
    { title: "Expired", value: stats?.expired ?? "-", color: "from-red-600 to-red-800", icon: AlertTriangle, delay: 0.1 },
    { title: "Expiring Soon", value: stats?.expiring_soon ?? "-", color: "from-orange-500 to-orange-700", icon: Clock, delay: 0.2 },
    { title: "Active Vehicles", value: stats?.active_vehicles ?? "-", color: "from-emerald-600 to-emerald-800", icon: CheckCircle, delay: 0.3 },
  ], [stats]);

  const adminCards = useMemo(() => [
    { title: "Registered Users", value: stats?.total_users ?? "-", color: "from-indigo-600 to-indigo-800", icon: Users, delay: 0.4 },
    { title: "Active Users", value: stats?.active_users ?? "-", color: "from-teal-600 to-teal-800", icon: UserCheck, delay: 0.5 },
    { title: "Deleted Users", value: stats?.total_deleted_users ?? "-", color: "from-rose-600 to-rose-800", icon: UserX, delay: 0.6 },
  ], [stats]);

  return (
    <div className="flex bg-gray-50 dark:bg-gray-950 min-h-screen">
      <Sidebar />
      <div className="flex-1 min-h-screen pl-16 lg:pl-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white"
              >
                Welcome back, {username}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-gray-500 dark:text-gray-400 mt-1"
              >
                Here&apos;s what&apos;s happening with your fleet today
              </motion.p>
            </div>
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={fetchStats}
              disabled={loading}
              className="flex items-center gap-2 bg-gray-800 border border-gray-700 px-5 py-2.5 rounded-xl text-gray-300 hover:bg-gray-700 hover:border-gray-600 transition-all disabled:opacity-50 shadow-lg"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              {loading ? "Refreshing..." : "Refresh"}
            </motion.button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-900/30 border border-red-800/50 text-red-300 p-4 rounded-xl mb-6 flex items-start gap-3 backdrop-blur-sm"
            >
              <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Error loading dashboard</p>
                <p className="text-sm text-red-400 mt-0.5">{error}</p>
                <button onClick={fetchStats} className="text-sm text-red-300 underline mt-1 hover:no-underline">
                  Try again
                </button>
              </div>
            </motion.div>
          )}

          {loading && !stats && (
            <div className="flex flex-col items-center justify-center mt-32 text-gray-500">
              <RefreshCw size={32} className="animate-spin mb-4" />
              <p>Loading dashboard...</p>
            </div>
          )}

          {stats && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {cards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <motion.div
                      key={card.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: card.delay, duration: 0.4 }}
                      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                      className={`bg-gradient-to-br ${card.color} rounded-2xl p-6 text-white shadow-lg shadow-black/20 cursor-default`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium text-white/70">{card.title}</p>
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                          <Icon size={20} />
                        </div>
                      </div>
                      <p className="text-3xl sm:text-4xl font-bold truncate">{card.value}</p>
                    </motion.div>
                  );
                })}
              </div>

              {isAdmin && (
                <>
                  <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-6"
                  >
                    <Users size={24} className="text-indigo-400" />
                    Users Overview
                  </motion.h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                    {adminCards.map((card) => {
                      const Icon = card.icon;
                      return (
                        <motion.div
                          key={card.title}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: card.delay, duration: 0.4 }}
                          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                          className={`bg-gradient-to-br ${card.color} rounded-2xl p-6 text-white shadow-lg shadow-black/20 cursor-default`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-medium text-white/70">{card.title}</p>
                            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                              <Icon size={20} />
                            </div>
                          </div>
                          <p className="text-3xl sm:text-4xl font-bold truncate">{card.value}</p>
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="mt-8"
              >
                <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  <TrendingUp size={24} className="text-blue-400" />
                  Vehicle Analytics
                </h2>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                      <Activity size={18} className="text-blue-400" />
                      Vehicle Status Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={vehicleChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={110}
                          paddingAngle={4}
                          dataKey="value"
                          animationBegin={300}
                          animationDuration={1000}
                        >
                          {vehicleChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} stroke="transparent" />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "12px", color: "#e5e7eb" }}
                          formatter={(value, name) => [`${value} vehicles`, name]}
                        />
                        <Legend
                          formatter={(value) => <span style={{ color: "#9ca3af" }}>{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                      <Calendar size={18} className="text-purple-400" />
                      Vehicles by Status
                    </h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={barChartData} animationBegin={300} animationDuration={1000}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" tick={{ fill: "#9ca3af" }} />
                        <YAxis tick={{ fill: "#9ca3af" }} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "12px", color: "#e5e7eb" }}
                          formatter={(value) => [`${value} vehicles`]}
                        />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={80}>
                          {barChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>

              {isAdmin && stats.users_by_role && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                  className="mt-8"
                >
                  <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    <Users size={24} className="text-teal-400" />
                    User Analytics
                  </h2>
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Users by Role</h3>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={[
                          { name: "Admin", count: stats.users_by_role.admin, fill: "#8b5cf6" },
                          { name: "Staff", count: stats.users_by_role.staff, fill: "#3b82f6" },
                          { name: "Viewer", count: stats.users_by_role.viewer, fill: "#6b7280" },
                        ]} animationBegin={500} animationDuration={1000}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="name" tick={{ fill: "#9ca3af" }} />
                          <YAxis tick={{ fill: "#9ca3af" }} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "12px", color: "#e5e7eb" }}
                          />
                          <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={80}>
                            {[{ fill: "#8b5cf6" }, { fill: "#3b82f6" }, { fill: "#6b7280" }].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Subscription Status</h3>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Active", value: stats.users_by_subscription.active, color: "#22c55e" },
                              { name: "Free", value: stats.users_by_subscription.free, color: "#6b7280" },
                              { name: "Expired", value: stats.users_by_subscription.expired, color: "#ef4444" },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={90}
                            paddingAngle={4}
                            dataKey="value"
                            animationBegin={500}
                            animationDuration={1000}
                          >
                            {[
                              { fill: "#22c55e" },
                              { fill: "#6b7280" },
                              { fill: "#ef4444" },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "12px", color: "#e5e7eb" }}
                          />
                          <Legend
                            formatter={(value) => <span style={{ color: "#9ca3af" }}>{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.5 }}
                className="mt-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Vehicles in System</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.total_vehicles}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Health Score</p>
                    <p className="text-3xl font-bold mt-1">
                      {stats.total_vehicles > 0
                        ? Math.round((stats.active_vehicles / stats.total_vehicles) * 100)
                        : 0}%
                    </p>
                  </div>
                  <div className="flex gap-6 flex-wrap">
                    <div className="text-center">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.active_vehicles}</p>
                    </div>
                    <div className="text-center">
                      <div className="w-3 h-3 rounded-full bg-orange-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">Due Soon</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.expiring_soon}</p>
                    </div>
                    <div className="text-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">Expired</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.expired}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
