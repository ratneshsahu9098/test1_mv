import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";

const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Plans = lazy(() => import("./pages/Plans"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Vehicles = lazy(() => import("./pages/Vehicles"));
const Users = lazy(() => import("./pages/Users"));
const Settings = lazy(() => import("./pages/Settings"));
const DeletedVehicles = lazy(() => import("./pages/DeletedVehicles"));
const DeletedUsers = lazy(() => import("./pages/DeletedUsers"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Requests = lazy(() => import("./pages/Requests"));

function App() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400 text-lg animate-pulse">Loading...</div>
      </div>
    }>
    <Routes>
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/vehicles"
        element={
          <ProtectedRoute>
            <div className="flex">
              <Sidebar />
              <div className="flex-1 bg-gray-50 dark:bg-gray-950 min-h-screen lg:pl-0 pl-16">
                <Vehicles />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route path="/plans" element={<Plans />} />
      <Route
        path="/login"
        element={
          <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
            <Login />
          </div>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <div className="flex">
              <Sidebar />
              <div className="flex-1 bg-gray-50 dark:bg-gray-950 min-h-screen lg:pl-0 pl-16">
                <Users />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <div className="flex">
              <Sidebar />
              <div className="flex-1 bg-gray-50 dark:bg-gray-950 min-h-screen lg:pl-0 pl-16">
                <Settings />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/deleted"
        element={
          <ProtectedRoute>
            <div className="flex">
              <Sidebar />
              <div className="flex-1 bg-gray-50 dark:bg-gray-950 min-h-screen lg:pl-0 pl-16">
                <DeletedVehicles />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <div className="flex">
              <Sidebar />
              <div className="flex-1 bg-gray-50 dark:bg-gray-950 min-h-screen lg:pl-0 pl-16">
                <Notifications />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/deleted-users"
        element={
          <ProtectedRoute>
            <div className="flex">
              <Sidebar />
              <div className="flex-1 bg-gray-50 dark:bg-gray-950 min-h-screen lg:pl-0 pl-16">
                <DeletedUsers />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests"
        element={
          <ProtectedRoute>
            <div className="flex">
              <Sidebar />
              <div className="flex-1 bg-gray-50 dark:bg-gray-950 min-h-screen lg:pl-0 pl-16">
                <Requests />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
    </Suspense>
  );
}

export default App;
