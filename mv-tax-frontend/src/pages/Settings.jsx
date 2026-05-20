import {
  useState
} from "react";

import axios from "axios";

function Settings() {

  const [
    username,
    setUsername
  ] = useState(
    localStorage.getItem(
      "username"
    ) || ""
  );

  const [
    password,
    setPassword
  ] = useState("");

  const updateProfile = async () => {

    try {

      const token =
        localStorage.getItem(
          "token"
        );

      await axios.put(
        "http://127.0.0.1:5000/api/update_profile",
        {
          username,
          password
        },
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

      localStorage.setItem(
        "username",
        username
      );

      alert(
        "Profile updated"
      );

      window.location.reload();

    } catch (error) {

      console.log(error);

      alert(
        "Update failed"
      );

    }

  };

  return (

    <div className="p-10">

      <h1 className="text-5xl font-bold mb-10">
        Settings
      </h1>

      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-xl">

        <h2 className="text-2xl font-bold mb-6">
          Update Profile
        </h2>

        <div className="space-y-4">

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) =>
              setUsername(
                e.target.value
              )
            }
            className="w-full p-4 border rounded-xl"
          />

          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            className="w-full p-4 border rounded-xl"
          />

          <button
            onClick={updateProfile}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl"
          >
            Save Changes
          </button>

        </div>

      </div>

    </div>

  );

}

export default Settings;