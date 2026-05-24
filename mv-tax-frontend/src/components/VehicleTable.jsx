import {
    useState,
    useEffect
} from "react";

import toast from "react-hot-toast";
import EditVehicleModal from "./EditVehicleModal";
import axios from "axios";
import API_URL from "../config";
import { Lock, MoreVertical } from "lucide-react";
import HistoryModal from "./HistoryModal";
import FetchModal from "./FetchModal";

function VehicleTable({
    vehicles
}) {
    const role =
        localStorage.getItem("role");

    const [selectedVehicle, setSelectedVehicle] =
        useState(null);
    const [historyData, setHistoryData] =
        useState([]);

    const [historyOpen, setHistoryOpen] =
        useState(false);

    const [isModalOpen, setIsModalOpen] =
        useState(false);

    const [loadingFetch, setLoadingFetch] =
        useState(null);
    const [fetchLogs, setFetchLogs] =
        useState([]);
    const [fetchError, setFetchError] =
        useState(null);
    const [fetchVehicle, setFetchVehicle] =
        useState(null);
    const [fetchLoading, setFetchLoading] =
        useState(false);

    const [loadingDelete, setLoadingDelete] =
        useState(null);
    const [sendingEmail, setSendingEmail] =
        useState(null);
    const [sendingPush, setSendingPush] =
        useState(null);

    const [openMenuId, setOpenMenuId] =
        useState(null);

    useEffect(() => {
        if (!openMenuId) return;
        const handleClick = () => setOpenMenuId(null);
        document.addEventListener("mousedown", handleClick);
        document.addEventListener("touchstart", handleClick);
        return () => {
            document.removeEventListener("mousedown", handleClick);
            document.removeEventListener("touchstart", handleClick);
        };
    }, [openMenuId]);

    const sendEmailReminder = async (vehicle) => {
        try {
            setSendingEmail(vehicle.id);
            const token = localStorage.getItem("token");
            await axios.post(
                API_URL + "/api/send_reminder",
                { vehicle_id: vehicle.id, channel: "email" },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Email reminder sent for ${vehicle.vehicle_number}`);
        } catch (error) {
            const msg = error.response?.data?.error || "Email send failed";
            toast.error(msg);
        } finally {
            setSendingEmail(null);
        }
    };

    const sendPushReminder = async (vehicle) => {
        try {
            setSendingPush(vehicle.id);
            const token = localStorage.getItem("token");
            await axios.post(
                API_URL + "/api/send_reminder",
                { vehicle_id: vehicle.id, channel: "push" },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Push sent for ${vehicle.vehicle_number}`);
        } catch (error) {
            const msg = error.response?.data?.error || "Push send failed";
            toast.error(msg);
        } finally {
            setSendingPush(null);
        }
    };

    const openEditModal = (vehicle) => {
        setSelectedVehicle(vehicle);
        setIsModalOpen(true);
    };

    const fetchVehicleInfo = async (vehicleNumber) => {
        try {
            setLoadingFetch(vehicleNumber);
            setFetchVehicle(vehicleNumber);
            setFetchLogs([]);
            setFetchError(null);
            setFetchLoading(true);
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${API_URL}/api/fetch_vehicle_info/${vehicleNumber}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const output = response.data?.output || "";
            setFetchLogs(output.split("\n").filter(Boolean));
            setFetchLoading(false);
            toast.success("Vehicle Updated Successfully");
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            setFetchLoading(false);
            const data = error.response?.data;
            const output = data?.output || "";
            if (output) {
                setFetchLogs(output.split("\n").filter(Boolean));
            } else {
                setFetchLogs([data?.error || "Unknown error"]);
            }
            if (data?.challan_pending) {
                setFetchError(data.error || "Pending challans on Parivahan");
                toast.error(data.error || "Pending challans on Parivahan");
            } else {
                setFetchError(data?.error || "Fetch Failed");
                toast.error(data?.error || "Fetch Failed");
            }
        } finally {
            setLoadingFetch(null);
        }
    };

    const closeFetchModal = () => {
        setFetchVehicle(null);
        setFetchLogs([]);
        setFetchError(null);
        setFetchLoading(false);
    };

    const openHistoryModal = async (vehicleId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${API_URL}/api/vehicle_history/${vehicleId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setHistoryData(response.data);
            setHistoryOpen(true);
        } catch (error) {
            toast.error("History Load Failed");
        }
    };

    const deleteVehicle = async (id) => {
        if (!window.confirm("Delete vehicle?")) return;
        try {
            setLoadingDelete(id);
            const token = localStorage.getItem("token");
            await axios.delete(
                `${API_URL}/api/delete_vehicle/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Vehicle Deleted");
            window.location.reload();
        } catch (error) {
            toast.error("Delete Failed");
        } finally {
            setLoadingDelete(null);
        }
    };

    const statusBadge = (expiryDate) => {
        const dueDate = new Date(expiryDate);
        const today = new Date();
        const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
            return <span className="px-3 py-1 rounded-full text-white text-sm font-medium bg-red-500">Expired</span>;
        }
        if (diffDays <= 7) {
            return <span className="px-3 py-1 rounded-full text-white text-sm font-medium bg-yellow-500">Due Soon</span>;
        }
        return <span className="px-3 py-1 rounded-full text-white text-sm font-medium bg-green-500">Active</span>;
    };

    return (
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Vehicle Records</h2>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-800">
                            <th className="text-left p-3 text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider">Vehicle</th>
                            <th className="text-left p-3 text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider">Owner</th>
                            <th className="text-left p-3 text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider hidden lg:table-cell">VAHAN Owner</th>
                            <th className="text-left p-3 text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider hidden lg:table-cell">Added By</th>
                            <th className="text-left p-3 text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider hidden md:table-cell">Email</th>
                            <th className="text-left p-3 text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider hidden md:table-cell">Chassis</th>
                            <th className="text-left p-3 text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider">Expiry</th>
                            <th className="text-left p-3 text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider hidden sm:table-cell">Status</th>
                            <th className="text-left p-3 text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vehicles.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="p-10 text-center text-gray-400 dark:text-gray-500">
                                    No vehicles found
                                </td>
                            </tr>
                        ) : (
                            vehicles.map((vehicle) => (
                                <tr key={vehicle.id} className="border-b border-gray-200 dark:border-gray-800/50 hover:bg-gray-100/30 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="p-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap max-w-[120px] sm:max-w-none truncate">{vehicle.vehicle_number}</td>
                                    <td className="p-3 text-gray-700 dark:text-gray-300 whitespace-nowrap max-w-[100px] sm:max-w-none truncate">{vehicle.owner}</td>
                                    <td className="p-3 text-gray-500 dark:text-gray-400 hidden lg:table-cell">{vehicle.vahan_owner_name || "-"}</td>
                                    <td className="p-3 text-gray-500 dark:text-gray-400 hidden lg:table-cell">{vehicle.added_by || "-"}</td>
                                    <td className="p-3 text-gray-500 dark:text-gray-400 max-w-[160px] truncate hidden md:table-cell">{vehicle.email || "-"}</td>
                                    <td className="p-3 text-gray-700 dark:text-gray-300 font-mono hidden md:table-cell">{vehicle.chassis_last5}</td>
                                    <td className="p-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">{vehicle.expiry_date}</td>
                                    <td className="p-3 hidden sm:table-cell">{statusBadge(vehicle.expiry_date)}</td>
                                    <td className="p-3">
                                        <div className="hidden sm:flex gap-1.5 flex-wrap">
                                            {role !== "viewer" ? (
                                                <button
                                                    onClick={() => fetchVehicleInfo(vehicle.vehicle_number)}
                                                    disabled={loadingFetch === vehicle.vehicle_number}
                                                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 min-h-[44px] rounded-lg text-sm font-medium disabled:opacity-50 transition-all"
                                                >
                                                    {loadingFetch === vehicle.vehicle_number ? "Fetching..." : "Fetch"}
                                                </button>
                                            ) : (
                                                <span className="bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 px-3 py-2 min-h-[44px] rounded-lg text-sm cursor-not-allowed inline-flex items-center gap-1.5"><Lock size={14} /> Fetch</span>
                                            )}
                                            {role !== "viewer" && (vehicle.email || localStorage.getItem("email")) ? (
                                                <button
                                                    onClick={() => sendEmailReminder(vehicle)}
                                                    disabled={sendingEmail === vehicle.id}
                                                    className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 min-h-[44px] rounded-lg text-sm font-medium disabled:opacity-50 transition-all"
                                                >
                                                    {sendingEmail === vehicle.id ? "..." : "Mail"}
                                                </button>
                                            ) : null}
                                            {role !== "viewer" && localStorage.getItem("fcm_token") ? (
                                                <button
                                                    onClick={() => sendPushReminder(vehicle)}
                                                    disabled={sendingPush === vehicle.id}
                                                    className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-2 min-h-[44px] rounded-lg text-sm font-medium disabled:opacity-50 transition-all"
                                                >
                                                    {sendingPush === vehicle.id ? "..." : "Push"}
                                                </button>
                                            ) : null}
                                            {role !== "viewer" ? (
                                                <button
                                                    onClick={() => openEditModal(vehicle)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-all"
                                                >
                                                    Edit
                                                </button>
                                            ) : (
                                                <span className="bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 px-3 py-2 min-h-[44px] rounded-lg text-sm cursor-not-allowed inline-flex items-center gap-1.5"><Lock size={14} /> Edit</span>
                                            )}
                                            <button
                                                onClick={() => openHistoryModal(vehicle.id)}
                                                className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-3 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-all"
                                            >
                                                History
                                            </button>
                                            {role === "admin" && (
                                                <button
                                                    onClick={() => deleteVehicle(vehicle.id)}
                                                    disabled={loadingDelete === vehicle.id}
                                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 min-h-[44px] rounded-lg text-sm font-medium disabled:opacity-50 transition-all"
                                                >
                                                    {loadingDelete === vehicle.id ? "..." : "Delete"}
                                                </button>
                                            )}
                                            {role !== "viewer" ? (
                                                <button
                                                    onClick={() => {
                                                        const message = `🚗 MV Tax Reminder\n\nVehicle: ${vehicle.vehicle_number}\nExpiry: ${vehicle.expiry_date}\nPlease renew your vehicle tax on time.\n- MV Tax`;
                                                        const whatsappUrl = `https://wa.me/91${vehicle.phone}?text=${encodeURIComponent(message)}`;
                                                        window.open(whatsappUrl, "_blank");
                                                    }}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-all"
                                                >
                                                    WhatsApp
                                                </button>
                                            ) : (
                                                <span className="bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 px-3 py-2 min-h-[44px] rounded-lg text-sm cursor-not-allowed inline-flex items-center gap-1.5"><Lock size={14} /> WhatsApp</span>
                                            )}
                                        </div>

                                        <div className="flex sm:hidden gap-1.5 flex-wrap">
                                            <button
                                                onClick={() => openEditModal(vehicle)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-all"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => openHistoryModal(vehicle.id)}
                                                className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-3 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-all"
                                            >
                                                History
                                            </button>
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.nativeEvent?.stopImmediatePropagation?.();
                                                        setOpenMenuId(openMenuId === vehicle.id ? null : vehicle.id);
                                                    }}
                                                    className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-3 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-all"
                                                >
                                                    <MoreVertical size={18} />
                                                </button>
                                                {openMenuId === vehicle.id && (
                                                    <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-2 min-w-[150px]">
                                                        {role !== "viewer" && (
                                                            <>
                                                                <button
                                                                    onClick={() => { fetchVehicleInfo(vehicle.vehicle_number); setOpenMenuId(null); }}
                                                                    disabled={loadingFetch === vehicle.vehicle_number}
                                                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
                                                                >
                                                                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                                                                    {loadingFetch === vehicle.vehicle_number ? "Fetching..." : "Fetch"}
                                                                </button>
                                                                {(vehicle.email || localStorage.getItem("email")) && (
                                                                    <button
                                                                        onClick={() => { sendEmailReminder(vehicle); setOpenMenuId(null); }}
                                                                        disabled={sendingEmail === vehicle.id}
                                                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
                                                                    >
                                                                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                                                                        {sendingEmail === vehicle.id ? "..." : "Mail"}
                                                                    </button>
                                                                )}
                                                                {localStorage.getItem("fcm_token") && (
                                                                    <button
                                                                        onClick={() => { sendPushReminder(vehicle); setOpenMenuId(null); }}
                                                                        disabled={sendingPush === vehicle.id}
                                                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
                                                                    >
                                                                        <span className="w-2 h-2 rounded-full bg-sky-500" />
                                                                        {sendingPush === vehicle.id ? "..." : "Push"}
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => {
                                                                        const message = `🚗 MV Tax Reminder\n\nVehicle: ${vehicle.vehicle_number}\nExpiry: ${vehicle.expiry_date}\nPlease renew your vehicle tax on time.\n- MV Tax`;
                                                                        window.open(`https://wa.me/91${vehicle.phone}?text=${encodeURIComponent(message)}`, "_blank");
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
                                                                >
                                                                    <span className="w-2 h-2 rounded-full bg-green-500" />
                                                                    WhatsApp
                                                                </button>
                                                                {role === "admin" && (
                                                                    <button
                                                                        onClick={() => { deleteVehicle(vehicle.id); setOpenMenuId(null); }}
                                                                        disabled={loadingDelete === vehicle.id}
                                                                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
                                                                    >
                                                                        <span className="w-2 h-2 rounded-full bg-red-500" />
                                                                        {loadingDelete === vehicle.id ? "..." : "Delete"}
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <EditVehicleModal
                key={selectedVehicle?.id || "vehicle-edit-modal"}
                vehicle={selectedVehicle}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
            <HistoryModal
                isOpen={historyOpen}
                onClose={() => setHistoryOpen(false)}
                historyData={historyData}
            />
            <FetchModal
                isOpen={!!fetchVehicle}
                onClose={closeFetchModal}
                vehicleNumber={fetchVehicle}
                logs={fetchLogs}
                loading={fetchLoading}
                error={fetchError}
            />
        </div>
    );
}

export default VehicleTable;