import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import API_URL from "../config";

function EditVehicleModal({
  vehicle,
  isOpen,
  onClose
}) {
  const [owner, setOwner] = useState(vehicle?.owner || "");
  const [phone, setPhone] = useState(vehicle?.phone || "");
  const [email, setEmail] = useState(vehicle?.email || "");
  const [chassisLast5, setChassisLast5] = useState(vehicle?.chassis_last5 || "");
  const [expiry, setExpiry] = useState(vehicle?.expiry_date || "");

  const updateVehicle = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/api/update_vehicle/${vehicle.id}`,
        { owner, phone, email, expiry, chassis_last5: chassisLast5 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Vehicle Updated");
      window.location.reload();
    } catch (error) {
      toast.error("Update Failed");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 sm:p-8 rounded-2xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Edit Vehicle</h2>

        <div className="space-y-4">
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Vehicle Number</label>
            <input
              type="text"
              value={vehicle?.vehicle_number || ""}
              disabled
              className="w-full p-3 bg-gray-100/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Owner</label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Owner"
              className="w-full p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone"
              className="w-full p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email for reminders"
              className="w-full p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Chassis Last 5</label>
            <input
              type="text"
              placeholder="Chassis Last 5"
              value={chassisLast5}
              maxLength={5}
              onChange={(e) => setChassisLast5(e.target.value.toUpperCase())}
              className="w-full p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Expiry Date</label>
            <input
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="w-full p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={onClose}
            className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-xl font-medium transition-all"
          >
            Cancel
          </button>
          <button
            onClick={updateVehicle}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditVehicleModal;