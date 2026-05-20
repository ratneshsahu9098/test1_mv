import {
  useState,
  useEffect
} from "react";

import axios from "axios";

function EditVehicleModal({
  vehicle,
  isOpen,
  onClose
}) {

  const [owner, setOwner] =
    useState("");

  const [phone, setPhone] =
    useState("");
  const [
    chassisLast5,
    setChassisLast5
  ] = useState(
    vehicle?.chassis_last5 || ""
  )

  const [expiry, setExpiry] =
    useState("");

  useEffect(() => {

    if (vehicle) {

      setOwner(
        vehicle.owner || ""
      );

      setPhone(
        vehicle.phone || ""
      );

      setExpiry(
        vehicle.expiry_date || ""
      );
      setChassisLast5(
        vehicle.chassis_last5 || ""
      );

    }

  }, [vehicle]);

  const updateVehicle = async () => {

    try {

      const token =
        localStorage.getItem(
          "token"
        );

      await axios.put(
        `http://127.0.0.1:5000/api/update_vehicle/${vehicle.id}`,
        {
          owner,
          phone,
          expiry,
          chassis_last5: chassisLast5
        },
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

      alert(
        "Vehicle Updated"
      );

      window.location.reload();

    } catch (error) {

      console.log(error);

      alert(
        "Update Failed"
      );

    }

  };

  if (!isOpen)
    return null;

  return (

    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

      <div className="bg-white p-8 rounded-2xl w-[500px]">

        <h2 className="text-3xl font-bold mb-6">
          Edit Vehicle
        </h2>

        <div className="space-y-4">

          <input
            type="text"
            value={owner}
            onChange={(e) =>
              setOwner(
                e.target.value
              )
            }
            placeholder="Owner"
            className="w-full p-3 border rounded-xl"
          />

          <input
            type="text"
            value={phone}
            onChange={(e) =>
              setPhone(
                e.target.value
              )
            }
            placeholder="Phone"
            className="w-full p-3 border rounded-xl"
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
            className="w-full p-4 border rounded-xl mb-4 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="date"
            value={expiry}
            onChange={(e) =>
              setExpiry(
                e.target.value
              )
            }
            className="w-full p-3 border rounded-xl"
          />

        </div>

        <div className="flex justify-end gap-4 mt-8">

          <button
            onClick={onClose}
            className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-3 rounded-xl"
          >
            Cancel
          </button>

          <button
            onClick={updateVehicle}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl"
          >
            Save
          </button>

        </div>

      </div>

    </div>

  );

}

export default EditVehicleModal;