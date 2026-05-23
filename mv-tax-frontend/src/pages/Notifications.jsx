import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Mail, MessageSquare, Smartphone, Clock, CheckCircle, XCircle } from "lucide-react";
import axios from "axios";
import API_URL from "../config";

function Notifications() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        API_URL + "/api/notification_logs",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLogs(data.logs || []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  const channelIcon = (channel) => {
    switch (channel) {
      case "email": return <Mail size={14} className="text-blue-400" />;
      case "telegram": return <MessageSquare size={14} className="text-sky-400" />;
      case "push": return <Smartphone size={14} className="text-green-400" />;
      default: return <Bell size={14} className="text-gray-400" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Recent reminder alerts sent from the system</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={fetchLogs}
          disabled={loading}
          className="bg-gray-800 text-gray-300 px-4 py-2 rounded-xl text-sm hover:bg-gray-700 transition-all disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </motion.button>
      </div>

      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-6">
        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading notifications...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <Bell size={40} className="mx-auto text-gray-500 mb-3" />
            <p className="text-gray-400 dark:text-gray-500">No notification history yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-600 mt-1">Reminders will appear here once sent</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log, i) => (
              <motion.div
                key={log.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800"
              >
                <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700">
                  {channelIcon(log.channel)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {log.vehicle_number || "Vehicle"} — {log.channel}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {log.message || "Reminder sent"}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {log.success ? (
                    <CheckCircle size={16} className="text-green-400" />
                  ) : (
                    <XCircle size={16} className="text-red-400" />
                  )}
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={12} />
                    {log.sent_at || ""}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
