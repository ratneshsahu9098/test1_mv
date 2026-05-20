import {
    useEffect,
    useState
} from "react";

import axios from "axios";

function Users() {

    const [users, setUsers] =
        useState([]);
    const [username, setUsername] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [role, setRole] =
        useState("staff");
    const [
        editUsername,
        setEditUsername
    ] = useState("");

    const [
        editPassword,
        setEditPassword
    ] = useState("");

    const [
        editUserId,
        setEditUserId
    ] = useState(null);

    useEffect(() => {

        fetchUsers();

    }, []);

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

        } catch (error) {

            console.log(error);

        }

    };

    const deleteUser = async (
        id
    ) => {

        if (
            !window.confirm(
                "Delete user?"
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
                `http://127.0.0.1:5000/api/delete_user/${id}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            fetchUsers();

        } catch (error) {

            console.log(error);

            alert(
                "Delete failed"
            );

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
                    username,
                    password,
                    role
                },
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            alert(
                "User Added"
            );

            setUsername("");

            setPassword("");

            setRole("staff");

            fetchUsers();

        } catch (error) {

            console.log(error);

            alert(
                "Add user failed"
            );

        }

    };
    const updateRole = async (
        id,
        role
    ) => {

        try {

            const token =
                localStorage.getItem(
                    "token"
                );

            await axios.put(
                `http://127.0.0.1:5000/api/update_user_role/${id}`,
                {
                    role
                },
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            alert(
                "Role Updated"
            );

            fetchUsers();

        } catch (error) {

            console.log(error);

        }

    };

    const updateUser = async () => {

        try {

            const token =
                localStorage.getItem(
                    "token"
                );

            await axios.put(
                `http://127.0.0.1:5000/api/update_user/${editUserId}`,
                {
                    username: editUsername,
                    password: editPassword
                },
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            alert(
                "User Updated"
            );

            setEditUserId(null);

            fetchUsers();

        } catch (error) {

            console.log(error);

            alert(
                "Update Failed"
            );

        }

    };
    const exportUser = async (
  id
) => {

  try {

    const token =
      localStorage.getItem(
        "token"
      );

    const response =
      await axios.get(
        `http://127.0.0.1:5000/api/export_user/${id}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          },
          responseType: "blob"
        }
      );

    const url =
      window.URL.createObjectURL(
        new Blob([response.data])
      );

    const link =
      document.createElement("a");

    link.href = url;

    link.setAttribute(
      "download",
      `user_${id}.xlsx`
    );

    document.body.appendChild(
      link
    );

    link.click();

  } catch (error) {

    console.log(error);

    alert(
      "Export failed"
    );

  }

};
    return (

        <div className="p-10">

            <h1 className="text-4xl font-bold mb-10">
                Users Management
            </h1>
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-10">

                <h2 className="text-2xl font-bold mb-6">
                    Add User
                </h2>

                <div className="grid grid-cols-4 gap-4">

                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) =>
                            setUsername(
                                e.target.value
                            )
                        }
                        className="p-4 border rounded-xl"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) =>
                            setPassword(
                                e.target.value
                            )
                        }
                        className="p-4 border rounded-xl"
                    />

                    <select
                        value={role}
                        onChange={(e) =>
                            setRole(
                                e.target.value
                            )
                        }
                        className="p-4 border rounded-xl"
                    >

                        <option value="admin">
                            Admin
                        </option>

                        <option value="staff">
                            Staff
                        </option>

                        <option value="viewer">
                            Viewer
                        </option>

                    </select>

                    <button
                        onClick={addUser}
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
                    >
                        Add User
                    </button>

                </div>

            </div>

            <button
                onClick={() =>
                    window.open(
                        "http://127.0.0.1:5000/api/export_users"
                    )
                }
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl mb-6"
            >
                Export Users Excel
            </button>
            <div className="bg-white rounded-2xl shadow-lg p-6">

                <table className="w-full">

                    <thead>

                        <tr className="border-b">

                            <th className="p-3 text-left">
                                ID
                            </th>

                            <th className="p-3 text-left">
                                Username
                            </th>

                            <th className="p-3 text-left">
                                Role
                            </th>

                            <th className="p-3 text-left">
                                Action
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {users.map((user) => (

                            <tr
                                key={user.id}
                                className="border-b"
                            >

                                <td className="p-3">
                                    {user.id}
                                </td>

                                <td className="p-3">
                                    {user.username}
                                </td>

                                <td className="p-3">

                                    <select
                                        value={user.role}
                                        disabled={
                                            user.username === "admin"
                                        }
                                        onChange={(e) =>
                                            updateRole(
                                                user.id,
                                                e.target.value
                                            )
                                        }
                                        className="border p-2 rounded-lg"
                                    >


                                        <option value="staff">
                                            Staff
                                        </option>

                                        <option value="viewer">
                                            Viewer
                                        </option>

                                    </select>

                                </td>

                                <td className="p-3 flex gap-2">

                                    {
                                        user.username !== "admin" && (

                                            <>

                                                <button
                                                    onClick={() => {

                                                        setEditUserId(
                                                            user.id
                                                        );

                                                        setEditUsername(
                                                            user.username
                                                        );

                                                        setEditPassword(
                                                            user.password || ""
                                                        );

                                                    }}
                                                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() =>
  exportUser(user.id)
}
                                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                                                >
                                                    Export
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        deleteUser(
                                                            user.id
                                                        )
                                                    }
                                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                                                >
                                                    Delete
                                                </button>

                                            </>

                                        )
                                    }

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>
            {
                editUserId && (

                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

                        <div className="bg-white p-8 rounded-2xl w-[400px]">

                            <h2 className="text-3xl font-bold mb-6">
                                Edit User
                            </h2>

                            <input
                                type="text"
                                placeholder="Username"
                                value={editUsername}
                                onChange={(e) =>
                                    setEditUsername(
                                        e.target.value
                                    )
                                }
                                className="w-full p-4 border rounded-xl mb-4"
                            />

                            <input
                                type="text"
                                placeholder="Password"
                                value={editPassword}
                                onChange={(e) =>
                                    setEditPassword(
                                        e.target.value
                                    )
                                }
                                className="w-full p-4 border rounded-xl mb-6"
                            />

                            <div className="flex justify-end gap-4">

                                <button
                                    onClick={() =>
                                        setEditUserId(null)
                                    }
                                    className="bg-gray-400 text-white px-6 py-3 rounded-xl"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={updateUser}
                                    className="bg-blue-500 text-white px-6 py-3 rounded-xl"
                                >
                                    Save
                                </button>

                            </div>

                        </div>

                    </div>

                )
            }
        </div>

    );

}

export default Users;