import {
    useEffect,
    useState
} from "react";


import axios from "axios";

import { CSVLink }
    from "react-csv";

function Dashboard() {

    const [
        changePasswordValue,

        setChangePasswordValue

    ] = useState("");

    const [
        deletedVehicles,

        setDeletedVehicles

    ] = useState([]);

    const [showPasswordBox,
        setShowPasswordBox] =
        useState(false);

    const [newUsername,
        setNewUsername] =
        useState("");

    const [newPassword,
        setNewPassword] =
        useState("");

    const [newRole,
        setNewRole] =
        useState("staff");
    const [users, setUsers] =
        useState([]);

    const role =
        localStorage.getItem(
            "role"
        );

    const [fetching, setFetching] =
        useState(false);

    const [selectedVehicle,
        setSelectedVehicle] =
        useState(null);

    const [historyData,
        setHistoryData] =
        useState([]);

    const [showHistory,
        setShowHistory] =
        useState(false);

    const [vehicles, setVehicles] =
        useState([]);

    const [editingId,
        setEditingId] =
        useState(null);

    const [search,
        setSearch] =
        useState("");

    const [vehicleNumber,
        setVehicleNumber] =
        useState("");

    const [chassisLast5, setChassisLast5] = useState("");

    const [stateName, setStateName] = useState("");

    const [supportDocument, setSupportDocument] = useState(null);

    const [expiryDate,
        setExpiryDate] =
        useState("");

    const [phone,
        setPhone] =
        useState("");

    const [owner,
        setOwner] =
        useState("");
    useEffect(() => {

        fetchVehicles();

        fetchUsers();

        fetchDeletedVehicles();

    }, []);

    const fetchVehicles = async () => {

        try {

            const token =
                localStorage.getItem("token");

            const response = await axios.get(

                "http://127.0.0.1:5000/api/vehicles",

                {
                    headers: {

                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            setVehicles(response.data);

        } catch (error) {

            console.log(error);
        }
    };
    const fetchUsers = async () => {

        try {

            const token =
                localStorage.getItem(
                    "token"
                );

            const response =
                await axios.get(

                    "http://127.0.0.1:5000/api/users",

                    {

                        headers: {

                            Authorization:
                                `Bearer ${token}`

                        }

                    }

                );

            setUsers(
                response.data
            );

        } catch (err) {

            console.log(err);

        }

    };
    const fetchDeletedVehicles =
        async () => {

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

                setDeletedVehicles(
                    response.data
                );

            } catch (err) {

                console.log(err);

            }

        };
    const addUser = async () => {

        try {

            const token =
                localStorage.getItem(
                    "token"
                );

            await axios.post(

                "http://127.0.0.1:5000/api/add_user",

                {

                    username:
                        newUsername,

                    password:
                        newPassword,

                    role:
                        newRole

                },

                {

                    headers: {

                        Authorization:
                            `Bearer ${token}`

                    }

                }

            );

            setNewUsername("");

            setNewPassword("");

            setNewRole("staff");

            fetchUsers();

        } catch (err) {

            console.log(err);

        }

    };

    const today = new Date();

    const expired = vehicles.filter(
        (v) => {

            if (!v.expiry_date)
                return false;

            const expiry =
                new Date(v.expiry_date);

            return expiry < today;
        }
    );

    const expiring = vehicles.filter(
        (v) => {

            if (!v.expiry_date)
                return false;

            const expiry =
                new Date(v.expiry_date);

            const diff =
                (expiry - today) /
                (1000 * 60 * 60 * 24);

            return diff >= 0 &&
                diff <= 7;
        }
    );

    const active = vehicles.filter(
        (v) => {

            if (!v.expiry_date)
                return false;

            const expiry =
                new Date(v.expiry_date);

            const diff =
                (expiry - today) /
                (1000 * 60 * 60 * 24);

            return diff > 7;
        }
    );
    const normalizeState = (
        state
    ) => {

        const value =
            state.trim().toLowerCase();

        const states = {

            ap: "Andhra Pradesh",
            "andhra pradesh": "Andhra Pradesh",

            ar: "Arunachal Pradesh",
            "arunachal pradesh": "Arunachal Pradesh",

            as: "Assam",
            assam: "Assam",

            br: "Bihar",
            bihar: "Bihar",

            cg: "Chhattisgarh",
            chhattisgarh: "Chhattisgarh",

            ga: "Goa",
            goa: "Goa",

            gj: "Gujarat",
            gujarat: "Gujarat",

            hr: "Haryana",
            haryana: "Haryana",

            hp: "Himachal Pradesh",
            "himachal pradesh": "Himachal Pradesh",

            jh: "Jharkhand",
            jharkhand: "Jharkhand",

            ka: "Karnataka",
            karnataka: "Karnataka",

            kl: "Kerala",
            kerala: "Kerala",

            mp: "Madhya Pradesh",
            "madhya pradesh": "Madhya Pradesh",

            mh: "Maharashtra",
            maharashtra: "Maharashtra",

            mn: "Manipur",
            manipur: "Manipur",

            ml: "Meghalaya",
            meghalaya: "Meghalaya",

            mz: "Mizoram",
            mizoram: "Mizoram",

            nl: "Nagaland",
            nagaland: "Nagaland",

            od: "Odisha",
            orissa: "Odisha",
            odisha: "Odisha",

            pb: "Punjab",
            punjab: "Punjab",

            rj: "Rajasthan",
            rajasthan: "Rajasthan",

            sk: "Sikkim",
            sikkim: "Sikkim",

            tn: "Tamil Nadu",
            "tamil nadu": "Tamil Nadu",

            ts: "Telangana",
            telangana: "Telangana",

            tr: "Tripura",
            tripura: "Tripura",

            up: "Uttar Pradesh",
            "uttar pradesh": "Uttar Pradesh",

            uk: "Uttarakhand",
            uttarakhand: "Uttarakhand",

            wb: "West Bengal",
            "west bengal": "West Bengal",

            an: "Andaman and Nicobar Islands",

            ch: "Chandigarh",

            dh: "Dadra and Nagar Haveli and Daman and Diu",

            dl: "Delhi",

            jk: "Jammu and Kashmir",

            la: "Ladakh",

            ld: "Lakshadweep",

            py: "Puducherry"

        };

        return (
            states[value] || state
        );
    };
    const detectStateFromVehicle = (
        vehicle
    ) => {

        const code =
            vehicle
                .slice(0, 2)
                .toLowerCase();

        return normalizeState(
            code
        );

    };
    const addVehicle = async () => {

        try {

            const token =
                localStorage.getItem("token");

            const formData =
                new FormData();

            formData.append(
                "vehicle_number",
                vehicleNumber
            );

            formData.append(
                "expiry_date",
                expiryDate
            );

            formData.append(
                "phone",
                phone
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
                "state_name",

                normalizeState(
                    stateName
                )

            );

            if (supportDocument) {

                formData.append(

                    "support_document",

                    supportDocument

                );

            }

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

            fetchVehicles();



            setVehicleNumber("");

            setExpiryDate("");

            setPhone("");

            setOwner("");

            setChassisLast5("");

            setStateName("");

            setSupportDocument(null);

            fetchVehicles();
        } catch (error) {

            console.log(error);
        }
    };

    const deleteVehicle = async (id) => {

        try {

            const token =
                localStorage.getItem("token");

            await axios.delete(

                `http://127.0.0.1:5000/api/delete_vehicle/${id}`,

                {
                    headers: {

                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            fetchVehicles();

        } catch (error) {

            console.log(error);
        }
    };

    const startEdit = (vehicle) => {
        setChassisLast5(
            vehicle.chassis_last5 || ""
        );

        setStateName(
            vehicle.state_name || ""
        );

        setEditingId(vehicle.id);

        setVehicleNumber(
            vehicle.vehicle_number
        );

        setExpiryDate(
            vehicle.expiry_date
        );

        setPhone(vehicle.phone);

        setOwner(vehicle.owner);
    };
    const updateVehicle = async () => {

        try {

            const token =
                localStorage.getItem("token");

            const formData =
                new FormData();

            formData.append(
                "vehicle_number",
                vehicleNumber
            );

            formData.append(
                "expiry_date",
                expiryDate
            );

            formData.append(
                "phone",
                phone
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
                "state_name",
                normalizeState(
                    stateName
                )
            );

            if (supportDocument) {

                formData.append(
                    "support_document",
                    supportDocument
                );

            }

            await axios.put(

                `http://127.0.0.1:5000/api/update_vehicle/${editingId}`,

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

            setEditingId(null);

            setVehicleNumber("");

            setExpiryDate("");

            setPhone("");

            setOwner("");

            setChassisLast5("");

            setStateName("");

            setSupportDocument(null);

            fetchVehicles();

        } catch (error) {

            console.log(error);
        }
    };
    const openVehicleInfo = (
        vehicle
    ) => {

        setSelectedVehicle(
            vehicle
        );

    };

    const filteredVehicles =
        vehicles.filter((vehicle) => {

            return (

                vehicle.vehicle_number
                    .toLowerCase()
                    .includes(
                        search.toLowerCase()
                    )

                ||

                vehicle.owner
                    .toLowerCase()
                    .includes(
                        search.toLowerCase()
                    )
            );
        });
    const sendWhatsApp = (vehicle) => {

        const message = `

🚗 MV Tax Reminder

Hello ${vehicle.owner},

Vehicle:
${vehicle.vehicle_number}

Chassis Last 5 Digit is:
${vehicle.chassis_last5}

Tax Expiry:
${vehicle.expiry_date}

Please renew your tax soon.

`;

        const url =

            `https://wa.me/91${vehicle.phone}?text=${encodeURIComponent(message)}`;

        window.open(url, "_blank");
    };

    const fetchVehicleInfo =
        async (vehicleNumber) => {

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

                console.log(
                    response.data
                );

                alert(
                    "Fetch started"
                );

            }

            catch (error) {

                console.log(error);

                alert(
                    "Fetch failed"
                );

            }

        };
    const viewHistory = async (id) => {

        try {

            const token =
                localStorage.getItem("token");

            const response =
                await axios.get(

                    `http://127.0.0.1:5000/api/vehicle_history/${id}`,

                    {
                        headers: {

                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            console.log(
                response.data
            );

            setHistoryData(
                response.data
            );

            setShowHistory(true);

        } catch (error) {

            console.log(error);
        }
    };

    return (

        <div className="p-8 bg-gray-100 min-h-screen">

            {/* NAVBAR */}

            <div className="flex justify-between items-center bg-black text-white p-5 rounded-2xl mb-8">

                <h2>
                    🚗 MV Tax Dashboard
                </h2>

                <button

                    className="logout-btn"

                    onClick={() => {

                        localStorage.removeItem(
                            "token"
                        );

                        window.location.href =
                            "/";
                    }}
                >

                    Logout

                </button>
                <CSVLink

                    data={vehicles}

                    filename={"vehicles.csv"}

                    style={{

                        background: "blue",

                        color: "white",

                        padding: "10px",

                        marginLeft: "10px",

                        textDecoration: "none",

                        borderRadius: "5px"
                    }}
                >

                    Export CSV

                </CSVLink>

            </div>
            <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
                <h2>Add Vehicle</h2>

                <input
                    type="text"
                    placeholder="Vehicle Number"
                    value={vehicleNumber}
                    onChange={(e) => {

                        const value =
                            e.target.value;

                        setVehicleNumber(
                            value.toUpperCase()
                        )
                        setStateName(

                            detectStateFromVehicle(
                                value
                            )

                        );

                    }}
                />

                <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) =>
                        setExpiryDate(e.target.value)
                    }
                />

                <input
                    type="text"
                    placeholder="Phone"
                    value={phone}
                    onChange={(e) =>
                        setPhone(e.target.value)
                    }
                />

                <input
                    type="text"
                    placeholder="Owner"
                    value={owner}
                    onChange={(e) =>
                        setOwner(e.target.value.toUpperCase())
                    }
                />
                <input

                    type="text"

                    placeholder="
    Last 5 Chassis Digits
    "

                    value={chassisLast5}

                    maxLength={5}

                    onChange={(e) =>

                        setChassisLast5(

                            e.target.value
                                .toUpperCase()

                        )

                    }

                />

                <input
                    type="text"
                    placeholder="State Name"
                    value={stateName}
                    onChange={(e) =>
                        setStateName(
                            e.target.value
                        )
                    }
                />

                <input
                    type="file"
                    onChange={(e) =>
                        setSupportDocument(
                            e.target.files[0]
                        )
                    }
                />

                {

                    editingId ? (

                        <button
                            onClick={updateVehicle}
                        >

                            Update Vehicle

                        </button>

                    ) : (

                        <button
                            onClick={addVehicle}
                        >

                            Add Vehicle

                        </button>
                    )
                }

            </div>


            <input
                type="text"
                placeholder="Search vehicle or owner"
                value={search}
                onChange={(e) =>
                    setSearch(e.target.value)
                }
                className="w-full p-4 rounded-2xl border border-gray-300 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 mb-8"
            />

            {/* ANALYTICS */}

            <div className="grid grid-cols-4 gap-6">

                <div className="bg-blue-500 text-white p-6 rounded-2xl shadow-lg">

                    <h2 className="text-xl font-bold">
                        Total Vehicles
                    </h2>

                    <p className="text-4xl font-bold mt-4">
                        {vehicles.length}
                    </p>

                </div>

                <div className="bg-red-500 text-white p-6 rounded-2xl shadow-lg">

                    <h2 className="text-xl font-bold">
                        Expired
                    </h2>

                    <p className="text-4xl font-bold mt-4">
                        {expired.length}
                    </p>

                </div>

                <div className="bg-orange-500 text-white p-6 rounded-2xl shadow-lg">

                    <h2 className="text-xl font-bold">
                        Expiring
                    </h2>

                    <p className="text-4xl font-bold mt-4">
                        {expiring.length}
                    </p>

                </div>

                <div className="bg-green-500 text-white p-6 rounded-2xl shadow-lg">

                    <h2 className="text-xl font-bold">
                        Active
                    </h2>

                    <p className="text-4xl font-bold mt-4">
                        {active.length}
                    </p>

                </div>

            </div>

            {/* TABLE */}

            <div className="bg-white rounded-3xl shadow-lg p-6 mt-10 overflow-x-auto">

                <h2>
                    Vehicle Records
                </h2>

                <table>

                    <thead>



                        <tr>

                            <th>ID</th>
                            <th>Vehicle</th>
                            <th>Expiry</th>
                            <th>Phone</th>
                            <th>Owner</th>
                            <th>
                                VAHAN Owner
                            </th>
                            <th>Status</th>
                            <th>Actions</th>

                        </tr>

                    </thead>

                    <tbody>

                        {filteredVehicles.map((vehicle) => (

                            <tr key={vehicle.id}>

                                <td>{vehicle.id}</td>

                                <td>
                                    {vehicle.vehicle_number}
                                </td>

                                <td>
                                    {vehicle.expiry_date}
                                </td>

                                <td>{vehicle.phone}</td>

                                <td>{vehicle.owner}</td>
                                <td>
                                    {
                                        vehicle.vahan_owner_name
                                        || "-"
                                    }
                                </td>
                                <td>

                                    {

                                        (() => {

                                            const today =
                                                new Date();

                                            const expiry =
                                                new Date(
                                                    vehicle.expiry_date
                                                );

                                            const diff =
                                                (expiry - today) /
                                                (1000 * 60 * 60 * 24);

                                            if (diff < 0) {

                                                return (

                                                    <span
                                                        style={{
                                                            color: "red",
                                                            fontWeight: "bold"
                                                        }}
                                                    >

                                                        Expired

                                                    </span>
                                                );
                                            }

                                            else if (diff <= 7) {

                                                return (

                                                    <span
                                                        style={{
                                                            color: "orange",
                                                            fontWeight: "bold"
                                                        }}
                                                    >

                                                        Expiring

                                                    </span>
                                                );
                                            }

                                            else {

                                                return (

                                                    <span
                                                        style={{
                                                            color: "green",
                                                            fontWeight: "bold"
                                                        }}
                                                    >

                                                        Active

                                                    </span>
                                                );
                                            }
                                        })()
                                    }

                                </td>

                                <td>


                                    {
                                        role !== "viewer" && (

                                            <button
                                                onClick={() =>
                                                    startEdit(vehicle)
                                                }
                                                className="
        bg-blue-500
        hover:bg-blue-600
        text-white
        px-4
        py-2
        rounded-xl
        mr-2
    "
                                            >
                                                Edit
                                            </button>

                                        )
                                    }

                                    <button

                                        onClick={() =>
                                            sendWhatsApp(vehicle)
                                        }

                                        className="
    bg-green-500
    hover:bg-green-600
    text-white
    px-4
    py-2
    rounded-xl
    mr-2
"
                                    >

                                        WhatsApp

                                    </button>
                                    <button

                                        onClick={() =>
                                            viewHistory(vehicle.id)
                                        }

                                        style={{
                                            background: "blue",
                                            marginRight: "10px"
                                        }}
                                    >

                                        History

                                    </button>
                                    {
                                        role !== "viewer" && (

                                            <button

                                                disabled={fetching}

                                                onClick={async () => {

                                                    setFetching(true);

                                                    try {

                                                        const token =
                                                            localStorage.getItem(
                                                                "token"
                                                            );

                                                        await axios.get(

                                                            `http://127.0.0.1:5000/api/fetch_vehicle_info/${vehicle.vehicle_number}`,

                                                            {

                                                                headers: {

                                                                    Authorization:
                                                                        `Bearer ${token}`

                                                                }

                                                            }

                                                        );

                                                        await fetchVehicles();

                                                    } catch (err) {

                                                        console.log(err);

                                                    }

                                                    setFetching(false);

                                                }}

                                            >

                                                {
                                                    fetching
                                                        ? "Fetching..."
                                                        : "Fetch Info"
                                                }

                                            </button>

                                        )
                                    }

                                    {/*vehicle info*/}
                                    <button

                                        onClick={() =>
                                            openVehicleInfo(vehicle)
                                        }

                                        className="
        bg-cyan-600
        text-white
        px-3
        py-1
        rounded
    "

                                    >

                                        View Vehicle Info

                                    </button>
                                    {
                                        role === "admin" && (

                                            <button
                                                onClick={() =>
                                                    deleteVehicle(vehicle.id)
                                                }
                                            >
                                                Delete
                                            </button>

                                        )
                                    }

                                </td>

                            </tr>
                        ))}

                    </tbody>

                </table>

            </div>


            {
                showHistory && (

                    <div
                        style={{

                            position: "fixed",

                            top: 0,
                            left: 0,

                            width: "100%",
                            height: "100%",

                            background:
                                "rgba(0,0,0,0.5)",

                            display: "flex",

                            justifyContent:
                                "center",

                            alignItems:
                                "center"
                        }}
                    >

                        <div
                            style={{

                                background: "white",

                                padding: "20px",

                                borderRadius: "10px",

                                width: "700px"
                            }}
                        >

                            <h2>
                                Vehicle History
                            </h2>

                            <button

                                onClick={() =>
                                    setShowHistory(false)
                                }

                                style={{
                                    background: "red",
                                    marginBottom: "20px"
                                }}
                            >

                                Close

                            </button>

                            <table>

                                <thead>

                                    <tr>

                                        <th>Vehicle</th>
                                        <th>Expiry</th>
                                        <th>Phone</th>
                                        <th>Owner</th>
                                        <th>Edited At</th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {historyData.map(
                                        (item, index) => (

                                            <tr key={index}>

                                                <td>
                                                    {item.vehicle_number}
                                                </td>

                                                <td>
                                                    {item.expiry_date}
                                                </td>

                                                <td>
                                                    {item.phone}
                                                </td>

                                                <td>
                                                    {item.owner}
                                                </td>

                                                <td>
                                                    {item.edited_at}
                                                </td>

                                            </tr>
                                        ))}

                                </tbody>

                            </table>

                        </div>

                    </div>
                )
            }
            {
                selectedVehicle && (

                    <div
                        style={{

                            position: "fixed",

                            top: 0,
                            left: 0,

                            width: "100%",
                            height: "100%",

                            background:
                                "rgba(0,0,0,0.5)",

                            display: "flex",

                            justifyContent:
                                "center",

                            alignItems:
                                "center",

                            zIndex: 9999

                        }}
                    >

                        <div
                            style={{

                                background: "white",

                                padding: "20px",

                                borderRadius: "10px",

                                width: "500px"

                            }}
                        >

                            <h2>
                                Vehicle Info
                            </h2>

                            <p>

                                <strong>
                                    Vehicle:
                                </strong>

                                {" "}

                                {
                                    selectedVehicle
                                        .vehicle_number
                                }

                            </p>

                            <p>

                                <strong>
                                    Chassis Last 5:
                                </strong>

                                {" "}

                                {
                                    selectedVehicle
                                        .chassis_last5
                                }

                            </p>

                            <p>

                                <strong>
                                    State:
                                </strong>

                                {" "}

                                {
                                    selectedVehicle
                                        .state_name
                                }

                            </p>

                            <p>

                                <strong>
                                    Support Document:
                                    {

                                        selectedVehicle
                                            ?.support_document && (

                                            <a

                                                href={

                                                    `http://127.0.0.1:5000/uploads/${selectedVehicle.support_document
                                                    }`

                                                }

                                                target="_blank"

                                                rel="noreferrer"

                                                style={{

                                                    color: "blue",

                                                    textDecoration:
                                                        "underline"

                                                }}

                                            >

                                                Open Document

                                            </a>

                                        )
                                    }
                                </strong>

                                {" "}

                                {
                                    selectedVehicle
                                        .support_document
                                }

                            </p>

                            <button

                                onClick={() =>
                                    setSelectedVehicle(
                                        null
                                    )
                                }

                                style={{
                                    background: "red",
                                    marginTop: "20px"
                                }}

                            >

                                Close

                            </button>

                        </div>

                    </div>
                )
            }
            {
                role === "admin" && (

                    <div className="bg-white rounded-3xl shadow-lg p-6 mt-10 overflow-x-auto">

                        <h2>
                            Users
                        </h2>

                        <div
                            style={{
                                marginBottom: "20px"
                            }}
                        >

                            <input

                                type="text"

                                placeholder="Username"

                                value={newUsername}

                                onChange={(e) =>
                                    setNewUsername(
                                        e.target.value
                                    )
                                }

                            />

                            <input

                                type="password"

                                placeholder="Password"

                                value={newPassword}

                                onChange={(e) =>
                                    setNewPassword(
                                        e.target.value
                                    )
                                }

                            />

                            <select

                                value={newRole}

                                onChange={(e) =>
                                    setNewRole(
                                        e.target.value
                                    )
                                }

                            >

                                <option value="staff">
                                    Staff
                                </option>

                                <option value="viewer">
                                    Viewer
                                </option>



                            </select>

                            <button
                                onClick={addUser}
                            >

                                Add User

                            </button>

                        </div>

                        <table>

                            <thead>

                                <tr>

                                    <th>ID</th>

                                    <th>Username</th>

                                    <th>Role</th>
                                    <th>
                                        Actions
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {
                                    users.map((user) => (

                                        <tr key={user.id}>

                                            <td>
                                                {user.id}
                                            </td>

                                            <td>
                                                {user.username}
                                            </td>

                                            <td>
                                                {user.role}
                                            </td>
                                            <td>

                                                {
                                                    user.username !== "admin" && (

                                                        <button

                                                            onClick={async () => {

                                                                try {

                                                                    const token =
                                                                        localStorage.getItem(
                                                                            "token"
                                                                        );

                                                                    await axios.delete(

                                                                        `http://127.0.0.1:5000/api/delete_user/${user.id}`,

                                                                        {

                                                                            headers: {

                                                                                Authorization:
                                                                                    `Bearer ${token}`

                                                                            }

                                                                        }

                                                                    );

                                                                    fetchUsers();

                                                                } catch (err) {

                                                                    console.log(err);

                                                                }

                                                            }}

                                                            className="
    bg-red-500
    hover:bg-red-600
    text-white
    px-4
    py-2
    rounded-xl
"

                                                        >

                                                            Delete

                                                        </button>

                                                    )
                                                }

                                            </td>

                                        </tr>

                                    ))
                                }

                            </tbody>

                        </table>

                    </div>
                )
            }
            {
                role === "admin" && (

                    <div className="bg-white rounded-3xl shadow-lg p-6 mt-10 overflow-x-auto">

                        <h2>
                            Deleted Vehicles
                        </h2>

                        <table>

                            <thead>

                                <tr>

                                    <th>ID</th>

                                    <th>Vehicle</th>

                                    <th>Owner</th>

                                    <th>Deleted By</th>

                                    <th>Deleted At</th>

                                    <th>Actions</th>

                                </tr>

                            </thead>

                            <tbody>

                                {
                                    deletedVehicles.map(

                                        (vehicle) => (

                                            <tr key={vehicle.id}>

                                                <td>
                                                    {vehicle.id}
                                                </td>

                                                <td>
                                                    {
                                                        vehicle.vehicle_number
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        vehicle.owner
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        vehicle.deleted_by
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        vehicle.deleted_at
                                                    }
                                                </td>

                                                <td>

                                                    <button

                                                        onClick={async () => {

                                                            try {

                                                                const token =
                                                                    localStorage.getItem(
                                                                        "token"
                                                                    );

                                                                await axios.post(

                                                                    `http://127.0.0.1:5000/api/restore_vehicle/${vehicle.id}`,

                                                                    {},

                                                                    {

                                                                        headers: {

                                                                            Authorization:
                                                                                `Bearer ${token}`

                                                                        }

                                                                    }

                                                                );

                                                                fetchVehicles();

                                                                fetchDeletedVehicles();

                                                            } catch (err) {

                                                                console.log(err);

                                                            }

                                                        }}

                                                        style={{
                                                            background: "green"
                                                        }}

                                                    >

                                                        Restore

                                                    </button>
                                                    <button

                                                        onClick={async () => {

                                                            try {

                                                                const token =
                                                                    localStorage.getItem(
                                                                        "token"
                                                                    );

                                                                await axios.delete(

                                                                    `http://127.0.0.1:5000/api/permanent_delete_vehicle/${vehicle.id}`,

                                                                    {

                                                                        headers: {

                                                                            Authorization:
                                                                                `Bearer ${token}`

                                                                        }

                                                                    }

                                                                );

                                                                fetchDeletedVehicles();

                                                            } catch (err) {

                                                                console.log(err);

                                                            }

                                                        }}

                                                        style={{
                                                            background: "red",
                                                            marginLeft: "10px"
                                                        }}

                                                    >

                                                        Permanent Delete

                                                    </button>

                                                </td>

                                            </tr>

                                        )

                                    )
                                }

                            </tbody>

                        </table>

                    </div>

                )
            }
        </div>


    );

}


export default Dashboard;