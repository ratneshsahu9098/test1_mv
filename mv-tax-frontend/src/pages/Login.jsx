import { useState } from "react";
import axios from "axios";

function Login() {

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const loginUser = async () => {

    try {

      const response = await axios.post(

        "http://127.0.0.1:5000/api/login",

        {
          username,
          password
        }
      );

      localStorage.setItem(
  "username",
  response.data.username
);
      localStorage.setItem(
        "token",
        response.data.token
      );
      localStorage.setItem(
        "role",
        response.data.role
      )
      localStorage.setItem(
  "username",
  response.data.username
);
      window.location.href =
  "/";

    } catch (error) {

      alert("Invalid Login");
    }
  };

  return (

  <div className="flex items-center justify-center h-screen bg-gray-100">

    <div className="bg-white p-10 rounded-2xl shadow-xl w-96">

      <h1 className="text-3xl font-bold mb-8 text-center">
        🔐 MV Tax Login
      </h1>

      <input
        type="text"
        placeholder="Username"
        onChange={(e) =>
          setUsername(e.target.value)
        }
        className="w-full p-4 border rounded-xl mb-4 outline-none focus:ring-2 focus:ring-blue-500"
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) =>
          setPassword(e.target.value)
        }
        className="w-full p-4 border rounded-xl mb-6 outline-none focus:ring-2 focus:ring-blue-500"
      />

      <button
        onClick={loginUser}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-xl font-semibold"
      >
        Login
      </button>

    </div>

  </div>

);
}

export default Login;