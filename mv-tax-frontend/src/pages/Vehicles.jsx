import {
  useEffect,
  useState,
  useCallback,
  useMemo
} from "react";

import toast from "react-hot-toast";
import axios from "axios";
import API_URL from "../config";

import { Search, AlertTriangle, CalendarX } from "lucide-react";
import AddVehicleForm from "../components/AddVehicleForm";
import VehicleTable from "../components/VehicleTable";

function Vehicles() {
  const [vehicles, setVehicles] =
    useState([]);
  const [search, setSearch] =
    useState("");
  const [statusFilter, setStatusFilter] =
    useState("All");
  const [currentPage, setCurrentPage] =
    useState(1);
  const [loading, setLoading] =
    useState(true);

  const pageSize = 10;

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const token =
        localStorage.getItem("token");
      const response =
        await axios.get(
          API_URL + "/api/vehicles",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      const data = response.data;
      const updatedVehicles =
        data.map((vehicle) => {
          const today = new Date();
          const expiry = new Date(vehicle.expiry_date);
          const diff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
          let status = "Active";
          if (diff < 0) {
            status = "Expired";
          } else if (diff <= 7) {
            status = "Expiring Soon";
          }
          return { ...vehicle, status };
        });
      setVehicles(updatedVehicles);
    } catch (error) {
      toast.error("Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const filteredVehicles = useMemo(() =>
    vehicles.filter((vehicle) => {
      const matchesSearch =
        vehicle.vehicle_number?.toLowerCase().includes(search.toLowerCase()) ||
        vehicle.owner?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || vehicle.status === statusFilter;
      return matchesSearch && matchesStatus;
    }),
  [vehicles, search, statusFilter]);

  const expiredVehicles = useMemo(() =>
    vehicles.filter((v) => v.status === "Expired"), [vehicles]);
  const dueSoonVehicles = useMemo(() =>
    vehicles.filter((v) => v.status === "Expiring Soon"), [vehicles]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredVehicles.length / pageSize)), [filteredVehicles]);
  const paginatedVehicles = useMemo(() => filteredVehicles.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  ), [filteredVehicles, currentPage]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-8">
        Vehicles
      </h1>

      <AddVehicleForm />

      <div className="mt-8 relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search vehicle or owner..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-4 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <div
          onClick={() => setStatusFilter("Expired")}
          className={`relative overflow-hidden bg-gradient-to-br from-red-600 to-red-800 text-white p-6 rounded-2xl shadow-lg cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ${statusFilter === "Expired" ? "ring-2 ring-red-300 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-950" : ""}`}
        >
          <CalendarX size={24} className="absolute top-4 right-4 text-white/20" />
          <p className="text-sm font-medium text-white/70">Expired Vehicles</p>
          <p className="text-4xl font-bold mt-2">{expiredVehicles.length}</p>
          <p className="text-xs text-white/50 mt-1">Tap to filter</p>
        </div>
        <div
          onClick={() => setStatusFilter("Expiring Soon")}
          className={`relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-700 text-white p-6 rounded-2xl shadow-lg cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ${statusFilter === "Expiring Soon" ? "ring-2 ring-orange-300 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-950" : ""}`}
        >
          <AlertTriangle size={24} className="absolute top-4 right-4 text-white/20" />
          <p className="text-sm font-medium text-white/70">Due Soon</p>
          <p className="text-4xl font-bold mt-2">{dueSoonVehicles.length}</p>
          <p className="text-xs text-white/50 mt-1">Tap to filter</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 mb-6">
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1">
          <button
            onClick={() => setStatusFilter("All")}
            className={`px-3 sm:px-4 py-2 min-h-[44px] rounded-xl font-medium transition-all whitespace-nowrap ${
              statusFilter === "All"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            All Vehicles
          </button>
          <button
            onClick={fetchVehicles}
            className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 sm:px-4 py-2 min-h-[44px] rounded-xl font-medium transition-all whitespace-nowrap"
          >
            Refresh
          </button>
          {statusFilter !== "All" && (
            <button
              onClick={() => setStatusFilter("All")}
              className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 sm:px-4 py-2 min-h-[44px] rounded-xl font-medium transition-all whitespace-nowrap"
            >
              Clear Filter
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="bg-purple-600/20 text-purple-300 px-3 sm:px-4 py-2 rounded-xl text-sm border border-purple-500/30 whitespace-nowrap">
            Total: {filteredVehicles.length}
          </span>
          {statusFilter !== "All" && (
            <span className="bg-blue-600/20 text-blue-300 px-3 sm:px-4 py-2 rounded-xl text-sm border border-blue-500/30 whitespace-nowrap">
              Filter: {statusFilter}
            </span>
          )}
        </div>
      </div>

      <VehicleTable vehicles={paginatedVehicles} />

      {loading && (
        <div className="text-center text-gray-400 dark:text-gray-500 mt-8">Loading vehicles...</div>
      )}

      {!loading && filteredVehicles.length === 0 && (
        <div className="text-center text-gray-400 dark:text-gray-500 mt-16">
          <p className="text-2xl mb-2">No vehicles found</p>
          <p className="text-gray-500 dark:text-gray-600">Add your first vehicle above or adjust your search.</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl font-medium transition-all"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {currentPage} of {totalPages}
            &nbsp;({filteredVehicles.length} vehicles)
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl font-medium transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default Vehicles;
