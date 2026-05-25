import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import API_URL from "../config";
import { Send, MessageSquare, CheckCircle, XCircle, Clock, Trash2, Reply, KeyRound } from "lucide-react";

function Requests() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const [requests, setRequests] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [respondId, setRespondId] = useState(null);
  const [respondText, setRespondText] = useState("");
  const [respondStatus, setRespondStatus] = useState("resolved");

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(API_URL + "/api/requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data);
    } catch {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        API_URL + "/api/requests",
        { title: title.trim(), description: description.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Request submitted");
      setTitle("");
      setDescription("");
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespond = async (reqId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/api/requests/${reqId}`,
        { status: respondStatus, admin_response: respondText.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Response saved");
      setRespondId(null);
      setRespondText("");
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to respond");
    }
  };

  const handleDelete = async (reqId) => {
    if (!window.confirm("Delete this request?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/requests/${reqId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Request deleted");
      fetchRequests();
    } catch {
      toast.error("Delete failed");
    }
  };

  const statusIcon = (status) => {
    switch (status) {
      case "resolved": return <CheckCircle size={16} className="text-green-400" />;
      case "rejected": return <XCircle size={16} className="text-red-400" />;
      default: return <Clock size={16} className="text-yellow-400" />;
    }
  };

  const statusBadge = (status) => {
    const colors = {
      pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      resolved: "bg-green-500/20 text-green-300 border-green-500/30",
      rejected: "bg-red-500/20 text-red-300 border-red-500/30",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colors[status] || colors.pending}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-8">Requests</h1>

      {role !== "admin" && (
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Send size={20} className="text-purple-400" />
            Submit a Request
          </h2>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setTitle("Password Reset Request");
                setDescription(`Username: ${localStorage.getItem("username")}\n\nI need to reset my password. Please approve.`);
              }}
              className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
            >
              <KeyRound size={16} />
              Password Reset
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <textarea
              placeholder="Describe your request..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {submitting ? "Submitting..." : "Send Request"}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <MessageSquare size={22} className="text-blue-400" />
          {role === "admin" ? "All Requests" : "My Requests"}
        </h2>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="text-center text-gray-400 dark:text-gray-500 py-16">
            <MessageSquare size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-lg">No requests yet</p>
            {role !== "admin" && <p className="text-sm mt-1">Submit one above.</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{req.title}</h3>
                      {statusBadge(req.status)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{req.description}</p>
                    {req.admin_response && (
                      <div className="mt-3 pl-4 border-l-2 border-purple-400/50">
                        <p className="text-xs text-purple-400 font-medium mb-1">Admin Response:</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{req.admin_response}</p>
                        {req.title.toLowerCase().includes("password reset") && req.status === "resolved" && role !== "admin" && (
                          <button
                            onClick={() => {
                              const match = (req.admin_response || "").match(/token=([\w-]+)/);
                              if (match) navigate(`/reset-password?token=${match[1]}`);
                            }}
                            className="mt-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                          >
                            <KeyRound size={15} />
                            Use Reset Link
                          </button>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                      <span>{req.username}</span>
                      <span>{req.created_at}</span>
                      {req.resolved_at && <span>Resolved: {req.resolved_at}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {role === "admin" && (
                      <>
                        <button
                          onClick={() => setRespondId(respondId === req.id ? null : req.id)}
                          className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all"
                          title="Respond"
                        >
                          <Reply size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(req.id)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                    {role !== "admin" && statusIcon(req.status)}
                  </div>
                </div>

                {respondId === req.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                    <select
                      value={respondStatus}
                      onChange={(e) => setRespondStatus(e.target.value)}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm outline-none"
                    >
                      <option value="resolved">Resolved</option>
                      <option value="rejected">Rejected</option>
                      <option value="pending">Pending</option>
                    </select>
                    <textarea
                      placeholder="Write a response..."
                      value={respondText}
                      onChange={(e) => setRespondText(e.target.value)}
                      rows={2}
                      className="w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRespond(req.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setRespondId(null)}
                        className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Requests;