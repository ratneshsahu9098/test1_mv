import toast from "react-hot-toast";
import {
  useEffect,
  useState
} from "react";

import axios from "axios";
import API_URL from "../config";

function DeletedVehicles() {
  const role = localStorage.getItem("role");
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  async function fetchDeletedVehicles() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        API_URL + "/api/deleted_vehicles",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVehicles(response.data);
    } catch (error) {
      toast.error("Something went wrong");
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDeletedVehicles();
  }, []);

  const restoreVehicle = async (id) => {
    try {
      setActionId(id);
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/api/restore_vehicle/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Vehicle restored");
      fetchDeletedVehicles();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setActionId(null);
    }
  };

  const permanentDelete = async (id) => {
    if (!window.confirm("Permanent delete?")) return;
    try {
      setActionId(id);
      const token = localStorage.getItem("token");
      await axios.delete(
        `${API_URL}/api/permanent_delete_vehicle/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Vehicle permanently deleted");
      fetchDeletedVehicles();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-8">Deleted Vehicles</h1>

      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-6 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="p-3 text-left text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider">Vehicle</th>
              <th className="p-3 text-left text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider">Owner</th>
              <th className="p-3 text-left text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider hidden sm:table-cell">Deleted By</th>
              <th className="p-3 text-left text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider hidden md:table-cell">Deleted At</th>
              <th className="p-3 text-left text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-gray-400 dark:text-gray-500">Loading...</td>
              </tr>
            ) : vehicles.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-gray-400 dark:text-gray-500">No deleted vehicles</td>
              </tr>
            ) : (
              vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="border-b border-gray-200 dark:border-gray-800/50 hover:bg-gray-100/30 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="p-3 font-medium text-gray-900 dark:text-white">{vehicle.vehicle_number}</td>
                  <td className="p-3 text-gray-700 dark:text-gray-300">{vehicle.owner}</td>
                  <td className="p-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">{vehicle.deleted_by}</td>
                  <td className="p-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">{vehicle.deleted_at}</td>
                    <td className="p-3">
                    <div className="flex gap-2 flex-wrap">
                      {role === "admin" ? (
                        <>
                          <button
                            onClick={() => restoreVehicle(vehicle.id)}
                            disabled={actionId === vehicle.id}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-all"
                          >
                            {actionId === vehicle.id ? "Restoring..." : "Restore"}
                          </button>
                          <button
                            onClick={() => permanentDelete(vehicle.id)}
                            disabled={actionId === vehicle.id}
                            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-all"
                          >
                            {actionId === vehicle.id ? "Deleting..." : "Delete Forever"}
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-sm">View only</span>
                      )}
                    </div>
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

export default DeletedVehicles;
