import {
  useEffect,
  useState
} from "react";

import axios from "axios";

function DeletedVehicles() {

  const [vehicles, setVehicles] =
    useState([]);

  useEffect(() => {

    fetchDeletedVehicles();

  }, []);

  const fetchDeletedVehicles = async () => {

    try {

      const token =
        localStorage.getItem(
          "token"
        );

      const response =
        await axios.get(
          "http://127.0.0.1:5000/api/deleted_vehicles",
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

      setVehicles(
        response.data
      );

    } catch (error) {

      console.log(error);

    }

  };

  const restoreVehicle = async (
    id
  ) => {

    try {

      const token =
        localStorage.getItem(
          "token"
        );

      await axios.post(
        `http://127.0.0.1:5000/api/restore_vehicle/${id}`,
        {},
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

      alert(
        "Vehicle Restored"
      );

      fetchDeletedVehicles();

    } catch (error) {

      console.log(error);

    }

  };

  const permanentDelete = async (
    id
  ) => {

    if (
      !window.confirm(
        "Permanent delete?"
      )
    ) {
      return;
    }

    try {

      const token =
        localStorage.getItem(
          "token"
        );

      await axios.delete(
        `http://127.0.0.1:5000/api/permanent_delete_vehicle/${id}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

      alert(
        "Deleted Permanently"
      );

      fetchDeletedVehicles();

    } catch (error) {

      console.log(error);

    }

  };

  return (

    <div className="p-10">

      <h1 className="text-4xl font-bold mb-10">
        Deleted Vehicles
      </h1>

      <div className="bg-white rounded-2xl shadow-lg p-6">

        <table className="w-full">

          <thead>

            <tr className="border-b">

              <th className="p-3 text-left">
                Vehicle
              </th>

              <th className="p-3 text-left">
                Owner
              </th>

              <th className="p-3 text-left">
                Deleted By
              </th>

              <th className="p-3 text-left">
                Deleted At
              </th>

              <th className="p-3 text-left">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {vehicles.map((vehicle) => (

              <tr
                key={vehicle.id}
                className="border-b"
              >

                <td className="p-3">
                  {vehicle.vehicle_number}
                </td>

                <td className="p-3">
                  {vehicle.owner}
                </td>

                <td className="p-3">
                  {vehicle.deleted_by}
                </td>

                <td className="p-3">
                  {vehicle.deleted_at}
                </td>

                <td className="p-3">

                  <div className="flex gap-2">

                    <button
                      onClick={() =>
                        restoreVehicle(
                          vehicle.id
                        )
                      }
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                    >
                      Restore
                    </button>

                    <button
                      onClick={() =>
                        permanentDelete(
                          vehicle.id
                        )
                      }
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                    >
                      Delete Forever
                    </button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

}

export default DeletedVehicles;