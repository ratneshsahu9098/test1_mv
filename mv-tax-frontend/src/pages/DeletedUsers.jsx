import toast from "react-hot-toast";
import {
  useEffect,
  useState
} from "react";

import axios from "axios";
import API_URL from "../config";

function DeletedUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  async function fetchDeletedUsers() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        API_URL + "/api/deleted_users",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(response.data);
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDeletedUsers();
  }, []);

  const restoreUser = async (id) => {
    try {
      setActionId(id);
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/api/restore_user/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("User restored");
      fetchDeletedUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || "Restore failed");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-8">Deleted Users</h1>

      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-6 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="p-3 text-left text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider">Username</th>
              <th className="p-3 text-left text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider">Email</th>
              <th className="p-3 text-left text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider">Phone</th>
              <th className="p-3 text-left text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider">Role</th>
              <th className="p-3 text-left text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider">Deleted At</th>
              <th className="p-3 text-left text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-400 dark:text-gray-500">Loading...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-400 dark:text-gray-500">No deleted users</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-gray-200 dark:border-gray-800/50 hover:bg-gray-100/30 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="p-3 font-medium text-gray-900 dark:text-white">{user.username}</td>
                  <td className="p-3 text-gray-500 dark:text-gray-400">{user.email || "-"}</td>
                  <td className="p-3 text-gray-500 dark:text-gray-400">{user.phone || "-"}</td>
                  <td className="p-3">
                    <span className={`font-medium ${
                      user.role === "admin" ? "text-purple-400" :
                      user.role === "staff" ? "text-blue-400" : "text-gray-500 dark:text-gray-400"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500 dark:text-gray-400">{user.deleted_at}</td>
                  <td className="p-3">
                    <button
                      onClick={() => restoreUser(user.id)}
                      disabled={actionId === user.id}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    >
                      {actionId === user.id ? "Restoring..." : "Restore"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DeletedUsers;
