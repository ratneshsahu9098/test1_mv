import Dashboard from "./pages/Dashboard";
import {
  useEffect,
  useState
} from "react";
import Login from "./pages/Login";
import {
  Routes,
  Route
} from "react-router-dom";

import Vehicles from "./pages/Vehicles";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import DeletedVehicles from "./pages/DeletedVehicles";
import ProtectedRoute from "./components/ProtectedRoute";
import AddVehicleForm from "./components/AddVehicleForm";
import VehicleTable from "./components/VehicleTable";
import axios from "axios";

import Sidebar from "./components/Sidebar";
import StatsCard from "./components/StatsCard";

function App() {


  const [vehicles, setVehicles] =
    useState([]);

  useEffect(() => {

    fetchVehicles();

  }, []);
  const [search, setSearch] =
    useState("");

  const fetchVehicles = async () => {

    try {

      const token =
        localStorage.getItem(
          "token"
        );

      const response =
        await axios.get(
          "http://127.0.0.1:5000/api/vehicles",
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

      console.log(response.data);

      const data =
        response.data.vehicles ||
        response.data;

      const updatedVehicles =
        data.map((vehicle) => {

          const today =
            new Date();

          const expiry =
            new Date(
              vehicle.expiry_date
            );

          const diff =
            Math.ceil(
              (
                expiry - today
              ) /
              (1000 * 60 * 60 * 24)
            );

          let status =
            "Active";

          if (diff < 0) {

            status = "Expired";

          } else if (diff <= 7) {

            status =
              "Expiring Soon";

          }

          return {
            ...vehicle,
            status
          };

        });

      setVehicles(
        updatedVehicles
      );
    } catch (error) {

      console.log(error);

    }

  };

  const total =
    vehicles.length;

  const expired =
    vehicles.filter(
      v => v.status === "Expired"
    ).length;

  const active =
    vehicles.filter(
      v => v.status === "Active"
    ).length;

  const expiring =
    vehicles.filter(
      v =>
        v.status ===
        "Expiring Soon"
    ).length;

  const filteredVehicles =
    vehicles.filter((vehicle) =>
      vehicle.vehicle_number
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        ) ||
      vehicle.owner
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

  return (

    <Routes>
      <Route
        path="/vehicles"
        element={
          <ProtectedRoute>

            <div className="flex">

              <Sidebar />

             <div className="flex-1 bg-gray-100 min-h-screen p-6">

                <Vehicles />

              </div>

            </div>

          </ProtectedRoute>
        }
      />
      <Route
  path="/login"
  element={
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">

      <Login />

    </div>
  }
/>
      <Route
  path="/users"
  element={
    <ProtectedRoute>

      <div className="flex">

        <Sidebar />

        <div className="flex-1 bg-gray-100 min-h-screen p-6">

          <Users />

        </div>

      </div>

    </ProtectedRoute>
  }
/>

      <Route
  path="/settings"
  element={
    <ProtectedRoute>

      <div className="flex">

        <Sidebar />

        <div className="flex-1 bg-gray-100 min-h-screen p-6">

          <Settings />

        </div>

      </div>

    </ProtectedRoute>
  }
/>

      <Route
        path="/"
        element={

          <ProtectedRoute>

            <div className="flex">

              <Sidebar />

              <div className="flex-1 p-10 bg-gray-100 min-h-screen">

                <h1 className="text-5xl font-bold mb-10">
                  Dashboard
                </h1>

                <div className="grid grid-cols-4 gap-6">

                  <StatsCard
                    title="Total Vehicles"
                    value={total}
                    color="bg-blue-500"
                  />

                  <StatsCard
                    title="Expired"
                    value={expired}
                    color="bg-red-500"
                  />

                  <StatsCard
                    title="Expiring Soon"
                    value={expiring}
                    color="bg-orange-500"
                  />

                  <StatsCard
                    title="Active"
                    value={active}
                    color="bg-green-500"
                  />

                </div>



              </div>

            </div>

          </ProtectedRoute>

        }
      />
      <Route
  path="/deleted"
  element={
    <ProtectedRoute>

      <div className="flex">

        <Sidebar />

        <div className="flex-1 bg-gray-100 min-h-screen p-6">

          <DeletedVehicles />

        </div>

      </div>

    </ProtectedRoute>
  }
/>
    </Routes>


  );

}

export default App;