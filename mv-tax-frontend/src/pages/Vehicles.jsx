import {
  useEffect,
  useState
} from "react";

import axios from "axios";

import AddVehicleForm from "../components/AddVehicleForm";
import VehicleTable from "../components/VehicleTable";

function Vehicles() {

  const [vehicles, setVehicles] =
    useState([]);

  const [search, setSearch] =
    useState("");

  useEffect(() => {

    fetchVehicles();

  }, []);

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

      const data =
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

    <div className="p-10">

      <h1 className="text-5xl font-bold mb-10">
        Vehicles
      </h1>

      <AddVehicleForm />

      <div className="mt-10">

        <input
          type="text"
          placeholder="Search vehicle or owner..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          className="w-full p-4 rounded-xl border border-gray-300 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
        />

      </div>

      <VehicleTable
        vehicles={filteredVehicles}
      />

    </div>

  );

}

export default Vehicles;