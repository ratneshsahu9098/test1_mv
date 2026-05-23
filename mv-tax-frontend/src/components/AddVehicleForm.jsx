import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import API_URL from "../config";

function AddVehicleForm() {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [owner, setOwner] = useState("");
  const [chassisLast5, setChassisLast5] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(localStorage.getItem("email") || "");
  const [expiry, setExpiry] = useState("");
  const [stateName, setStateName] = useState("");
  const [adding, setAdding] = useState(false);

  const addVehicle = async () => {
    if (!vehicleNumber || vehicleNumber.trim().length < 4) {
      toast.error("Enter a valid vehicle number");
      return;
    }
    try {
      setAdding(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("vehicle_number", vehicleNumber);
      formData.append("owner", owner);
      formData.append("chassis_last5", chassisLast5);
      formData.append("phone", phone);
      formData.append("email", email);
      formData.append("expiry_date", expiry);
      formData.append("state_name", stateName);
      await axios.post(API_URL + "/api/add_vehicle", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Vehicle Added");
      setVehicleNumber("");
      setOwner("");
      setChassisLast5("");
      setPhone("");
      setEmail(localStorage.getItem("email") || "");
      setExpiry("");
      setStateName("");
      setTimeout(() => window.location.reload(), 800);
    } catch (error) {
      toast.error("Add Failed");
    } finally {
      setAdding(false);
    }
  };

  const startAiFetch = async () => {
    if (!vehicleNumber || vehicleNumber.trim().length < 4) {
      toast.error("Enter a valid vehicle number");
      return;
    }
    if (!chassisLast5 || chassisLast5.length !== 5) {
      toast.error("Enter chassis last 5 digits");
      return;
    }
    setAiFetching(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        API_URL + "/api/ai_fetch",
        { vehicle_number: vehicleNumber, chassis_last5: chassisLast5 },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 180000 }
      );
      const data = res.data;
      if (data.success && data.data) {
        autoFill(data.data);
        toast.success("AI Fetch complete — data auto-filled");
      } else if (data.captcha_needed) {
        setPendingFetch({ vehicle_number: vehicleNumber, chassis_last5: chassisLast5 });
        setCaptchaImage(data.captcha_image);
        setShowCaptcha(true);
      } else {
        toast.error(data.error || "AI Fetch failed");
      }
    } catch (error) {
      const msg = error.response?.data?.error || error.message || "Fetch failed";
      toast.error(`AI Fetch: ${msg}`);
    } finally {
      setAiFetching(false);
    }
  };

  const handleCaptchaSubmit = async (captchaInput) => {
    if (!pendingFetch) return;
    setShowCaptcha(false);
    setCaptchaImage(null);
    setAiFetching(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        API_URL + "/api/ai_fetch",
        { ...pendingFetch, captcha: captchaInput },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 180000 }
      );
      const data = res.data;
      if (data.success && data.data) {
        autoFill(data.data);
        toast.success("AI Fetch complete — data auto-filled");
      } else {
        toast.error(data.error || "AI Fetch failed after CAPTCHA");
      }
    } catch (error) {
      const msg = error.response?.data?.error || error.message || "CAPTCHA failed";
      toast.error(msg);
    } finally {
      setAiFetching(false);
      setPendingFetch(null);
    }
  };

  const autoFill = (data) => {
    if (data.owner_name) setOwner(data.owner_name.toUpperCase());
    if (data.tax_upto) setExpiry(data.tax_upto);
    if (data.vehicle_number) setVehicleNumber(data.vehicle_number.toUpperCase());
    const stCode = (data.vehicle_number || vehicleNumber).slice(0, 2).toUpperCase();
    const stateMap = {
      "WB": "West Bengal", "BR": "Bihar", "OD": "Odisha", "PB": "Punjab",
      "HR": "Haryana", "KL": "Kerala", "TS": "Telangana", "JK": "Jammu and Kashmir",
      "UK": "Uttarakhand", "GA": "Goa", "MH": "Maharashtra", "MP": "Madhya Pradesh",
      "DL": "Delhi", "UP": "Uttar Pradesh", "RJ": "Rajasthan", "CG": "Chhattisgarh",
      "GJ": "Gujarat", "KA": "Karnataka", "TN": "Tamil Nadu", "AP": "Andhra Pradesh",
      "NL": "Nagaland", "AS": "Assam", "HP": "Himachal Pradesh", "PY": "Puducherry",
      "AN": "Andaman and Nicobar", "CH": "Chandigarh", "DN": "Dadra and Nagar Haveli",
      "DD": "Daman and Diu", "LD": "Lakshadweep", "MN": "Manipur", "ML": "Meghalaya",
      "MZ": "Mizoram", "SK": "Sikkim", "TR": "Tripura",
      "AR": "Arunachal Pradesh", "JH": "Jharkhand",
    };
    if (stateMap[stCode]) setStateName(stateMap[stCode]);
  };

  return (
    <>
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Add Vehicle
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Vehicle Number</label>
            <input
              type="text"
              placeholder="e.g. MH40CT1182"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
              className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Owner</label>
            <input
              type="text"
              placeholder="Owner name"
              value={owner}
              onChange={(e) => setOwner(e.target.value.toUpperCase())}
              className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Chassis Last 5</label>
            <input
              type="text"
              placeholder="Last 5 digits"
              value={chassisLast5}
              maxLength={5}
              onChange={(e) => setChassisLast5(e.target.value.toUpperCase())}
              className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
            <input
              type="text"
              placeholder="Mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
            <input
              type="email"
              placeholder="Email for reminders"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">State</label>
            <input
              type="text"
              placeholder="Auto-detected"
              value={stateName}
              onChange={(e) => setStateName(e.target.value)}
              className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Tax Due Date</label>
            <input
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={addVehicle}
            disabled={adding}
            className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold transition-all"
          >
            {adding ? "Adding..." : "Add Vehicle"}
          </button>
        </div>
      </div>
    </>
  );
}

export default AddVehicleForm;
