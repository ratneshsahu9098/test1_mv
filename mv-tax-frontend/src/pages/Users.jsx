import {
    useEffect,
    useState
} from "react";

import toast from "react-hot-toast";
import axios from "axios";
import API_URL from "../config";


function Users() {
    const [users, setUsers] = useState([]);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("staff");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [editUsername, setEditUsername] = useState("");
    const [editPassword, setEditPassword] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editUserId, setEditUserId] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                API_URL + "/api/users",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUsers(response.data);
        } catch (error) {
            const message = error.response?.data?.error || error.response?.data?.msg || "";
            if (error.response?.status === 401 || error.response?.status === 422) {
                toast.error(message || "Session expired. Please login again.");
                localStorage.removeItem("token");
                localStorage.removeItem("username");
                localStorage.removeItem("role");
                window.location.href = "/login";
            }
        }
    }

    const deleteUser = async (id) => {
        if (!window.confirm("Delete user?")) return;
        try {
            const token = localStorage.getItem("token");
            await axios.delete(
                `${API_URL}/api/delete_user/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.error || error.response?.data?.msg || "Delete failed");
        }
    };

    const handleSubscriptionAction = async (id, action) => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                `${API_URL}/api/user_subscription/${id}`,
                { action },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(
                action === "upgrade" ? "Subscription upgraded" :
                action === "extend" ? "Subscription extended" : "Subscription downgraded"
            );
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.error || error.response?.data?.msg || "Subscription update failed");
        }
    };

    const addUser = async () => {
        if (!username.trim() || !password) {
            toast.error("Username and password are required");
            return;
        }
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        if (phone && !/^\d{10}$/.test(phone)) {
            toast.error("Enter valid 10 digit mobile number");
            return;
        }
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                API_URL + "/api/add_user",
                { username, email, phone, password, role },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("User Added");
            setUsername("");
            setEmail("");
            setPhone("");
            setPassword("");
            setRole("staff");
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.error || error.response?.data?.msg || "Add user failed");
        }
    };

    const updateRole = async (id, role) => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(
                `${API_URL}/api/update_user_role/${id}`,
                { role },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Role Updated");
            fetchUsers();
        } catch (error) {
        }
    };

    const updateUser = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(
                `${API_URL}/api/update_user/${editUserId}`,
                { username: editUsername, email: editEmail, phone: editPhone, password: editPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("User Updated");
            setEditUserId(null);
            fetchUsers();
        } catch (error) {
            toast.error("Update Failed");
        }
    };

    const exportUser = async (id) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${API_URL}/api/export_user/${id}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: "blob"
                }
            );
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `user_${id}.xlsx`);
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            toast.error("Export failed");
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-8">
                Users Management
            </h1>

            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add User</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                    <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Username</label>
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Mobile</label>
                        <input
                            type="text"
                            placeholder="Mobile Number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            maxLength={10}
                            className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Password</label>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="staff">Staff</option>
                            <option value="viewer">Viewer</option>
                        </select>
                    </div>
                    <button
                        onClick={addUser}
                        className="h-[48px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all"
                    >
                        Add User
                    </button>
                </div>
            </div>

            <button
                onClick={async () => {
                    try {
                        const token = localStorage.getItem("token");
                        const res = await axios.get(API_URL + "/api/export_users", {
                            headers: { Authorization: `Bearer ${token}` },
                            responseType: "blob"
                        });
                        const url = window.URL.createObjectURL(new Blob([res.data]));
                        const link = document.createElement("a");
                        link.href = url;
                        link.setAttribute("download", "all_users.xlsx");
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                    } catch {
                        toast.error("Export failed");
                    }
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium mb-6 transition-all"
            >
                Export Users Excel
            </button>

            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-6 overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-800">
                            <th className="p-3 text-left text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider hidden md:table-cell">ID</th>
                            <th className="p-3 text-left text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider">Username</th>
                            <th className="p-3 text-left text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider hidden lg:table-cell">Email</th>
                            <th className="p-3 text-left text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider hidden lg:table-cell">Mobile</th>
                            <th className="p-3 text-left text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider">Vehicles</th>
                            <th className="p-3 text-left text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider hidden sm:table-cell">Plan</th>
                            <th className="p-3 text-left text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider hidden lg:table-cell">Expiry</th>
                            <th className="p-3 text-left text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider hidden sm:table-cell">Status</th>
                            <th className="p-3 text-left text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider hidden md:table-cell">Role Control</th>
                            <th className="p-3 text-left text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider">Subscription</th>
                            <th className="p-3 text-left text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="border-b border-gray-200 dark:border-gray-800/50 hover:bg-gray-100/30 dark:hover:bg-gray-800/30 transition-colors">
                                <td className="p-3 text-gray-700 dark:text-gray-300 hidden md:table-cell">{user.id}</td>
                                <td className="p-3 text-gray-900 dark:text-white font-medium">{user.username}</td>
                                <td className="p-3 text-gray-500 dark:text-gray-400 hidden lg:table-cell">{user.email || "-"}</td>
                                <td className="p-3 text-gray-500 dark:text-gray-400 hidden lg:table-cell">{user.phone || "-"}</td>
                                <td className="p-3">
                                    <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                                        {user.vehicle_count ?? 0}
                                    </span>
                                </td>
                                <td className="p-3 hidden sm:table-cell">
                                    <span className={`font-medium ${
                                        user.role === "admin" ? "text-purple-400" :
                                        user.role === "staff" ? "text-blue-400" : "text-gray-400"
                                    }`}>
                                        {user.role === "viewer" ? "Free" : user.role === "staff" ? "Staff Pro" : "Admin"}
                                    </span>
                                </td>
                                <td className="p-3 text-gray-400 hidden lg:table-cell">{user.subscription_expiry || "-"}</td>
                                <td className="p-3 hidden sm:table-cell">
                                    {user.subscription_status === "active" ? (
                                        <span className="text-green-400 font-medium bg-green-500/10 px-3 py-1 rounded-full text-sm">Active</span>
                                    ) : (
                                        <span className="text-gray-400 dark:text-gray-500 bg-gray-200/50 dark:bg-gray-700/50 px-3 py-1 rounded-full text-sm">Free</span>
                                    )}
                                </td>
                                <td className="p-3 hidden md:table-cell">
                                    <select
                                        value={user.role}
                                        disabled={user.username === "admin"}
                                        onChange={(e) => updateRole(user.id, e.target.value)}
                                        className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                    >
                                        <option value="staff">Staff</option>
                                        <option value="viewer">Viewer</option>
                                    </select>
                                </td>
                                <td className="p-3">
                                    <div className="flex gap-2 flex-wrap">
                                        <button
                                            disabled={user.username === "admin"}
                                            onClick={() => handleSubscriptionAction(user.id, "upgrade")}
                                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-all"
                                        >
                                            Upgrade
                                        </button>
                                        <button
                                            disabled={user.username === "admin"}
                                            onClick={() => handleSubscriptionAction(user.id, "extend")}
                                            className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white px-3 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-all"
                                        >
                                            Extend
                                        </button>
                                        <button
                                            disabled={user.username === "admin"}
                                            onClick={() => handleSubscriptionAction(user.id, "downgrade")}
                                            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-all"
                                        >
                                            Down
                                        </button>
                                    </div>
                                </td>
                                <td className="p-3">
                                    {user.username !== "admin" && (
                                        <div className="flex gap-1.5 flex-wrap">
                                            <button
                                                onClick={() => {
                                                    setEditUserId(user.id);
                                                    setEditUsername(user.username);
                                                    setEditPassword(user.password || "");
                                                    setEditEmail(user.email || "");
                                                    setEditPhone(user.phone || "");
                                                }}
                                                className="bg-orange-600 hover:bg-orange-700 text-white px-2.5 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-all"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => exportUser(user.id)}
                                                className="bg-green-600 hover:bg-green-700 text-white px-2.5 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-all"
                                            >
                                                Export
                                            </button>
                                            <button
                                                onClick={() => deleteUser(user.id)}
                                                className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-all"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editUserId && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 sm:p-8 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Edit User</h2>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Username"
                                value={editUsername}
                                onChange={(e) => setEditUsername(e.target.value)}
                                className="w-full p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                className="w-full p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="text"
                                placeholder="Mobile Number"
                                value={editPhone}
                                onChange={(e) => setEditPhone(e.target.value)}
                                maxLength={10}
                                className="w-full p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="text"
                                placeholder="Password (leave blank to keep current)"
                                value={editPassword}
                                onChange={(e) => setEditPassword(e.target.value)}
                                className="w-full p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex justify-end gap-4 mt-8">
                            <button
                                onClick={() => setEditUserId(null)}
                                className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-xl font-medium transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={updateUser}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Users;
