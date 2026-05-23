import { useState, useEffect, memo } from "react";
import { LayoutDashboard, Car, Users, Trash2, Settings, LogOut, Sun, Moon, ChevronLeft, ChevronRight, Sparkles, Menu, X, Bell, MessageSquare } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../ThemeContext";
import toast from "react-hot-toast";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/vehicles", label: "Vehicles", icon: Car },
  { path: "/users", label: "Users", icon: Users, adminOnly: true },
  { path: "/requests", label: "Requests", icon: MessageSquare, adminOnly: true },
  { path: "/deleted", label: "Deleted Vehicles", icon: Trash2, shortLabel: "Deleted" },
  { path: "/deleted-users", label: "Deleted Users", icon: Trash2, adminOnly: true },
  { path: "/notifications", label: "Notifications", icon: Bell, shortLabel: "Alerts" },
  { path: "/plans", label: "Plans", icon: Sparkles },
  { path: "/settings", label: "Settings", icon: Settings },
];

const Sidebar = memo(function Sidebar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("sidebar_collapsed") === "true");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const username = localStorage.getItem("username") || "User";
  const role = localStorage.getItem("role");
  const expiry = localStorage.getItem("subscription_expiry");
  const initial = username.charAt(0).toUpperCase();

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar_collapsed", next);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("phone");
    localStorage.removeItem("subscription_status");
    localStorage.removeItem("subscription_expiry");
    toast.success("Logged out");
    window.location.href = "/login";
  };

  const filteredNav = navItems.filter((item) => !item.adminOnly || role === "admin");

  const sidebarContent = (
    <>
      <div className={`flex items-center p-5 ${collapsed && !isMobile ? "justify-center" : "justify-between"} border-b border-gray-200 dark:border-gray-800`}>
        <AnimatePresence mode="wait">
          {(!collapsed || isMobile) && (
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent"
            >
              MV Tax
            </motion.h1>
          )}
        </AnimatePresence>
        {isMobile ? (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all"
          >
            <X size={18} />
          </button>
        ) : (
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      <div className={`p-4 ${collapsed && !isMobile ? "flex flex-col items-center gap-3" : ""}`}>
        <div className={`flex ${collapsed && !isMobile ? "flex-col" : "items-center gap-3"} mb-4`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
            {initial}
          </div>
          <AnimatePresence mode="wait">
            {(!collapsed || isMobile) && (
              <motion.div
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                className="min-w-0"
              >
                <p className="text-sm font-semibold truncate">{username}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{role}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {(!collapsed || isMobile) ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-4 text-white shadow-lg overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} className="text-yellow-300" />
                <p className="text-[11px] opacity-80 uppercase tracking-wider">Current Plan</p>
              </div>
              <p className="text-lg font-bold">
                {role === "viewer" ? "Free" : role === "staff" ? "Staff Pro" : "Admin"}
              </p>
              {role === "staff" && expiry && (
                <p className="text-[11px] mt-1 opacity-80">Till {expiry}</p>
              )}
              {role === "viewer" && (
                <button
                  onClick={() => { window.location.href = "/plans"; setMobileOpen(false); }}
                  className="mt-3 w-full bg-white text-purple-700 py-1.5 rounded-xl text-sm font-semibold hover:scale-[1.03] transition-all"
                >
                  Upgrade ₹19
                </button>
              )}
            </motion.div>
          ) : role === "viewer" ? (
            <motion.button
              key="upgrade-mini"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => window.location.href = "/plans"}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white shadow-md hover:scale-105 transition-all"
              title="Upgrade plan"
            >
              <Sparkles size={16} />
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>

      <nav className="flex-1 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {filteredNav.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <motion.li
                key={item.path}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04, duration: 0.25 }}
              >
                <Link
                  to={item.path}
                  title={collapsed && !isMobile ? item.label : undefined}
                  onClick={() => isMobile && setMobileOpen(false)}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-medium"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-gray-200"
                  } ${collapsed && !isMobile ? "justify-center" : ""}`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="active-bar"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon size={20} className="flex-shrink-0" />
                  <AnimatePresence mode="wait">
                    {(!collapsed || isMobile) && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="text-sm truncate"
                      >
                        {item.shortLabel || item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {collapsed && !isMobile && (
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none">
                      {item.label}
                    </div>
                  )}
                </Link>
              </motion.li>
            );
          })}

          <li className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-800" />

          <motion.li
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.25 }}
          >
            <button
              onClick={toggleTheme}
              title={collapsed && !isMobile ? (theme === "dark" ? "Light Mode" : "Dark Mode") : undefined}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group w-full ${
                collapsed && !isMobile ? "justify-center" : ""
              } text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-gray-200`}
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              <AnimatePresence mode="wait">
                {(!collapsed || isMobile) && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-sm truncate"
                  >
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </motion.li>

          <motion.li
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.25 }}
          >
            <button
              onClick={logout}
              title={collapsed && !isMobile ? "Logout" : undefined}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group w-full ${
                collapsed && !isMobile ? "justify-center" : ""
              } text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400`}
            >
              <LogOut size={20} />
              <AnimatePresence mode="wait">
                {(!collapsed || isMobile) && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-sm truncate"
                  >
                    Logout
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </motion.li>
        </ul>
      </nav>
    </>
  );

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 shadow-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-all lg:hidden"
          title="Open menu"
        >
          <Menu size={20} />
        </button>
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40 lg:hidden"
                onClick={() => setMobileOpen(false)}
              />
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-black text-gray-900 dark:text-white flex flex-col border-r border-gray-200 dark:border-gray-800 z-50 shadow-2xl"
              >
                {sidebarContent}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <motion.aside
      layout
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`h-screen bg-white dark:bg-black text-gray-900 dark:text-white flex flex-col border-r border-gray-200 dark:border-gray-800 relative flex-shrink-0 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {sidebarContent}
    </motion.aside>
  );
});

export default Sidebar;
