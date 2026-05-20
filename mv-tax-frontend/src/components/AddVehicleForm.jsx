import {
    useState
} from "react";

import axios from "axios";

function AddVehicleForm() {

    const [vehicleNumber, setVehicleNumber] =
        useState("");

    const [owner, setOwner] =
        useState("");

    const [
        chassisLast5,
        setChassisLast5
    ] = useState("");

    const [phone, setPhone] =
        useState("");

    const [expiry, setExpiry] =
        useState("");

    const addVehicle = async () => {

        try {

            const token =
                localStorage.getItem(
                    "token"
                );

            const formData =
                new FormData();

            formData.append(
                "vehicle_number",
                vehicleNumber
            );

            formData.append(
                "owner",
                owner
            );
            formData.append(
                "chassis_last5",
                chassisLast5
            );

            formData.append(
                "phone",
                phone
            );

            formData.append(
                "expiry_date",
                expiry
            );

            await axios.post(
                "http://127.0.0.1:5000/api/add_vehicle",
                formData,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                        "Content-Type":
                            "multipart/form-data"
                    }
                }
            );

            alert(
                "Vehicle Added"
            );

            window.location.reload();

        } catch (error) {

            console.log(error);

            alert(
                "Add Failed"
            );

        }

    };

    return (

        <div className="bg-white p-6 rounded-2xl shadow-lg mt-10">

            <h2 className="text-2xl font-bold mb-6">
                Add Vehicle
            </h2>

            <div className="grid grid-cols-4 gap-4">

                <input
                    type="text"
                    placeholder="Vehicle Number"
                    value={vehicleNumber}
                    onChange={(e) =>
                        setVehicleNumber(
                            e.target.value.toUpperCase()
                        )
                    }
                    className="p-3 border rounded-xl"
                />

                <input
                    type="text"
                    placeholder="Owner"

                    value={owner}
                    onChange={(e) =>
                        setOwner(
                            e.target.value.toUpperCase()
                        )
                    }
                    className="p-3 border rounded-xl"
                />
                <input
                    type="text"
                    placeholder="Chassis Last 5"
                    value={chassisLast5}
                    maxLength={5}
                    onChange={(e) =>
                        setChassisLast5(
                            e.target.value.toUpperCase()
                        )
                    }
                />

                <input
                    type="text"
                    placeholder="Phone"
                    value={phone}
                    onChange={(e) =>
                        setPhone(
                            e.target.value
                        )
                    }
                    className="p-3 border rounded-xl"
                />

                <input
                    type="date"
                    value={expiry}
                    onChange={(e) =>
                        setExpiry(
                            e.target.value
                        )
                    }
                    className="p-3 border rounded-xl"
                />

            </div>

            <button
                onClick={addVehicle}
                className="mt-6 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl"
            >
                Add Vehicle
            </button>

        </div>

    );

}

export default AddVehicleForm;