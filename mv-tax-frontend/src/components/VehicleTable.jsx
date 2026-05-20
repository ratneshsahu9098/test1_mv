import {
    useState
} from "react";

import EditVehicleModal from "./EditVehicleModal";
import axios from "axios";
import HistoryModal from "./HistoryModal";

function VehicleTable({
    vehicles
}) {

    const [selectedVehicle, setSelectedVehicle] =
        useState(null);
    const [historyData, setHistoryData] =
        useState([]);

    const [historyOpen, setHistoryOpen] =
        useState(false);

    const [isModalOpen, setIsModalOpen] =
        useState(false);

    const openEditModal = (
        vehicle
    ) => {

        setSelectedVehicle(
            vehicle
        );

        setIsModalOpen(true);

    };
    const fetchVehicleInfo = async (
        vehicleNumber
    ) => {

        try {

            const token =
                localStorage.getItem(
                    "token"
                );

            const response =
                await axios.get(
                    `http://127.0.0.1:5000/api/fetch_vehicle_info/${vehicleNumber}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            alert(
                "Vehicle Updated Successfully"
            );

            console.log(
                response.data
            );

            window.location.reload();

        } catch (error) {

            console.log(error);

            alert(
                "Fetch Failed"
            );

        }

    };
    const openHistoryModal = async (
        vehicleId
    ) => {

        try {

            const token =
                localStorage.getItem(
                    "token"
                );

            const response =
                await axios.get(
                    `http://127.0.0.1:5000/api/vehicle_history/${vehicleId}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            setHistoryData(
                response.data
            );

            setHistoryOpen(true);

        } catch (error) {

            console.log(error);

            alert(
                "History Load Failed"
            );

        }

    };
    const deleteVehicle = async (
        id
    ) => {

        if (
            !window.confirm(
                "Delete vehicle?"
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
                `http://127.0.0.1:5000/api/delete_vehicle/${id}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            alert(
                "Vehicle Deleted"
            );

            window.location.reload();

        } catch (error) {

            console.log(error);

            alert(
                "Delete Failed"
            );

        }

    };
    return (

        <div className="mt-10 bg-white rounded-2xl shadow-lg p-6">

            <h2 className="text-2xl font-bold mb-6">
                Vehicle Records
            </h2>

            <div className="overflow-x-auto">

                <table className="w-full">

                    <thead>

                        <tr className="border-b">

                            <th className="text-left p-3">
                                Vehicle
                            </th>

                            <th className="text-left p-3">
                                Owner
                            </th>
                            <th className="text-left p-3">
                                VAHAN Owner
                            </th>
                            <th className="text-left p-3">
  Added By
</th>

                            <th className="text-left p-3">
                                Chassis Last 5
                            </th>


                            <th className="text-left p-3">
                                Expiry
                            </th>

                            <th className="text-left p-3">
                                Status
                            </th>
                            <th className="text-left p-3">
                                Actions
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {vehicles.map((vehicle) => (

                            <tr
                                key={vehicle.id}
                                className="border-b hover:bg-gray-100"
                            >

                                <td className="p-3 font-semibold">
                                    {vehicle.vehicle_number}
                                </td>

                                <td className="p-3">
                                    {vehicle.owner}
                                </td>
                                <td className="p-3">
                                    {vehicle.vahan_owner_name || "-"}
                                </td>
                            <td className="p-3">
  {vehicle.added_by || "-"}
</td>
                                <td className="p-3">
                                    {vehicle.chassis_last5}
                                </td>

                                <td className="p-3">
                                    {vehicle.expiry_date}
                                </td>

                                <td className="p-3">

                                    <span
                                        className={`px-3 py-1 rounded-full text-white text-sm
        ${vehicle.status === "Expired"
                                                ? "bg-red-500"
                                                : vehicle.status === "Active"
                                                    ? "bg-green-500"
                                                    : "bg-orange-500"
                                            }`}
                                    >

                                        {vehicle.status}

                                    </span>

                                </td>

                                <td className="p-3">

                                    <div className="flex flex-wrap gap-2">

                                        <button
                                            onClick={() =>
                                                fetchVehicleInfo(
                                                    vehicle.vehicle_number
                                                )

                                            }
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                                        >
                                            Fetch
                                        </button>

                                        <button
                                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                                        >
                                            WhatsApp
                                        </button>

                                        <button
                                            onClick={() =>
                                                openEditModal(
                                                    vehicle
                                                )
                                            }
                                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() =>
                                                deleteVehicle(
                                                    vehicle.id
                                                )
                                            }
                                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                                        >
                                            Delete
                                        </button>
                                        <button
                                            onClick={() =>
                                                openHistoryModal(
                                                    vehicle.id
                                                )
                                            }
                                            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg"
                                        >
                                            History
                                        </button>


                                    </div>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>
            <EditVehicleModal
                vehicle={selectedVehicle}
                isOpen={isModalOpen}
                onClose={() =>
                    setIsModalOpen(false)
                }
            />
            <HistoryModal
                isOpen={historyOpen}
                onClose={() =>
                    setHistoryOpen(false)
                }
                historyData={historyData}
            />
        </div>

    );

}


export default VehicleTable;