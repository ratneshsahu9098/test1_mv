import {
    LayoutDashboard,
    Car,
    Users,
    Trash2,
    Settings,
    LogOut
} from "lucide-react";

import {
    Link,
    useLocation
} from "react-router-dom";

// import { Link } from "react-router-dom";
function Sidebar() {

    const location =
        useLocation();

    const logout = () => {

        localStorage.clear();

        window.location.href = "/";

    };

    const username =
        localStorage.getItem(
            "username"
        );

    const role =
        localStorage.getItem(
            "role"
        );



    return (

        <div className="w-64 h-screen bg-black text-white p-5">

            <h1 className="text-2xl font-bold mb-10">
                🚗 MV Tax
            </h1>
            <div className="bg-gray-900 p-4 rounded-xl mb-8">

                <p className="text-sm text-gray-400">
                    Logged In As
                </p>

                <h2 className="text-lg font-bold text-green-400">
                    {username}
                </h2>

                <p className="text-xs text-gray-500 uppercase">
                    {role}
                </p>

            </div>
            <ul className="space-y-6">

                <li>

                    <Link
                        to="/"
                        className={`flex items-center gap-3 p-3 rounded-xl ${location.pathname === "/"
                            ? "bg-blue-500 text-white"
                            : "text-white hover:bg-gray-800"
                            }`}
                    >

                        <LayoutDashboard size={20} />

                        Dashboard

                    </Link>

                </li>

                <li>

                    <Link
                        to="/vehicles"
                        className={`flex items-center gap-3 p-3 rounded-xl ${location.pathname === "/vehicles"
                            ? "bg-blue-500 text-white"
                            : "text-white hover:bg-gray-800"
                            }`}
                    >

                        <Car size={20} />

                        Vehicles

                    </Link>

                </li>

                {
                    role === "admin" && (

                        <li>

                            <Link
                                to="/users"
                                className={`flex items-center gap-3 p-3 rounded-xl ${location.pathname === "/users"
                                    ? "bg-blue-500 text-white"
                                    : "text-white hover:bg-gray-800"
                                    }`}
                            >

                                <Users size={20} />

                                Users

                            </Link>

                        </li>

                    )
                }

                <li>

                    <Link
                        to="/deleted"
                        className={`flex items-center gap-3 p-3 rounded-xl ${location.pathname === "/deleted"
                            ? "bg-blue-500 text-white"
                            : "text-white hover:bg-gray-800"
                            }`}
                    >

                        <Trash2 size={20} />

                        Deleted

                    </Link>

                </li>

                <li>

                    <Link
                        to="/settings"
                        className={`flex items-center gap-3 p-3 rounded-xl ${location.pathname === "/settings"
                            ? "bg-blue-500 text-white"
                            : "text-white hover:bg-gray-800"
                            }`}
                    >

                        <Settings size={20} />

                        Settings

                    </Link>

                </li>

            </ul>
            <button
                onClick={logout}
                className="flex items-center gap-3 hover:text-red-400 cursor-pointer mt-10"
            >

                <LogOut size={20} />

                Logout

            </button>

        </div>

    );

}

export default Sidebar;