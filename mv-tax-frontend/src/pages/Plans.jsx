import axios from "axios";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Check, X, Sparkles, Shield, Calendar, RefreshCw } from "lucide-react";
import Sidebar from "../components/Sidebar";
import API_URL from "../config";

const API = API_URL;

const plans = [
  {
    name: "Free",
    role: "viewer",
    price: "0",
    period: "",
    description: "For basic browsing",
    gradient: "from-gray-500 to-gray-700",
    lightBg: "bg-gray-100",
    border: "border-gray-300",
    icon: Shield,
    features: [
      { text: "View Vehicles", included: true },
      { text: "Add Vehicles", included: false },
      { text: "Edit Vehicles", included: false },
      { text: "Delete Vehicles", included: false },
      { text: "Email Reminder", included: false },
      { text: "Export Excel", included: false },
      { text: "WhatsApp Reminder", included: false },
    ],
  },
  {
    name: "Staff Pro",
    role: "staff",
    price: "19",
    period: "/month",
    description: "For tax operators",
    gradient: "from-blue-600 to-purple-600",
    lightBg: "bg-white",
    border: "border-purple-400",
    icon: Sparkles,
    popular: true,
    features: [
      { text: "View Vehicles", included: true },
      { text: "Add Vehicles", included: true },
      { text: "Edit Vehicles", included: true },
      { text: "Delete Vehicles", included: true },
      { text: "Email Reminder", included: true },
      { text: "Export Excel", included: true },
      { text: "WhatsApp Reminder", included: true },
    ],
  },
];

function Plans() {
  const [userRole, setUserRole] = useState("viewer");
  const [loading, setLoading] = useState(false);
  const [subExpiry, setSubExpiry] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("role") || "viewer";
    const expiry = localStorage.getItem("subscription_expiry") || "";
    setUserRole(role);
    setSubExpiry(expiry);
  }, []);

  const handlePayment = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const orderRes = await axios.post(
        `${API}/api/create_order`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const order = orderRes.data;

      if (!order.id) {
        toast.error(order.error || "Failed to create order");
        setLoading(false);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_Ss14DV2TS3MjuD",
        amount: order.amount,
        currency: order.currency,
        name: "MV Tax",
        description: "Staff Pro Subscription",
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyRes = await axios.post(
              `${API}/api/verify_payment`,
              {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            localStorage.setItem("role", "staff");
            localStorage.setItem("subscription_status", "active");

            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);
            const expiryStr = expiryDate.toISOString().split("T")[0];
            localStorage.setItem("subscription_expiry", expiryStr);

            toast.success("Subscription Activated");
            setTimeout(() => window.location.reload(), 1000);
          } catch (error) {
            toast.error("Payment verification failed");
          }
          setLoading(false);
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
        theme: {
          color: "#7c3aed",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error("Failed to initiate payment");
      setLoading(false);
    }
  };

  const daysLeft = subExpiry
    ? Math.ceil((new Date(subExpiry) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="flex bg-gray-50 dark:bg-gray-950 min-h-screen">
      <Sidebar />
      <div className="flex-1 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-10"
          >
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-2">
              Choose Your{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Plan
              </span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Pick the plan that fits your needs. Upgrade anytime.
            </p>
          </motion.div>

          {userRole === "staff" && subExpiry && daysLeft > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-green-500/10 border border-green-500/30 rounded-2xl p-5 flex items-center gap-4"
            >
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
                <Calendar size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-400">Active Subscription</p>
                <p className="text-xs text-green-400/70 mt-0.5">
                  Your Staff Pro plan is active — {daysLeft} day(s) remaining (till {subExpiry})
                </p>
              </div>
            </motion.div>
          )}

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid md:grid-cols-2 gap-8 items-start"
          >
            {plans.map((plan) => {
              const isCurrent = userRole === plan.role;
              const PlanIcon = plan.icon;

              return (
                <motion.div
                  key={plan.name}
                  variants={itemAnim}
                  className={`
                    relative rounded-3xl p-5 sm:p-8 transition-all duration-500
                    ${isCurrent
                      ? "ring-2 ring-purple-500 shadow-xl shadow-purple-500/20 scale-[1.02]"
                      : "hover:scale-[1.02]"
                    }
                    ${plan.popular
                      ? "dark:bg-gray-900 bg-white border dark:border-purple-500/30 border-purple-400"
                      : "bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border dark:border-gray-800 border-gray-200"
                    }
                  `}
                >
                  {/* Background decoration */}
                  {plan.popular && (
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl" />
                  )}

                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs sm:text-sm font-semibold px-3 sm:px-5 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                        <Sparkles size={14} />
                        Most Popular
                      </span>
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full border border-green-500/30">
                        <Check size={12} />
                        Current
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${plan.gradient}`}>
                      <PlanIcon size={22} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{plan.name}</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
                    </div>
                  </div>

                  <div className="mt-6 mb-8">
                    <span className="text-5xl font-extrabold text-gray-900 dark:text-white">
                      ₹{plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-gray-400 text-lg ml-1">{plan.period}</span>
                    )}
                  </div>

                  <ul className="space-y-3.5 mb-8">
                    {plan.features.map((feat) => (
                      <li key={feat.text} className="flex items-center gap-3">
                        {feat.included ? (
                          <div className="flex-shrink-0 p-0.5 rounded-full bg-green-500/20">
                            <Check size={16} className="text-green-400" />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 p-0.5 rounded-full bg-gray-600/20">
                            <X size={16} className="text-gray-500" />
                          </div>
                        )}
                        <span className={feat.included ? "text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500"}>
                          {feat.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {plan.role === "staff" ? (
                    isCurrent ? (
                      <button
                        disabled
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600/50 to-blue-600/50 text-white/60 font-semibold cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Check size={18} />
                        Current Plan
                      </button>
                    ) : userRole === "viewer" ? (
                      <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <RefreshCw size={16} className="animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} />
                            Upgrade Now — ₹19
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full py-3.5 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-semibold cursor-not-allowed"
                      >
                        Not Available
                      </button>
                    )
                  ) : (
                    <button
                      disabled
                      className={`w-full py-3.5 rounded-xl font-semibold cursor-not-allowed flex items-center justify-center gap-2 ${
                        isCurrent
                          ? "bg-gradient-to-r from-purple-600/50 to-blue-600/50 text-white/60"
                          : "bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {isCurrent ? (
                        <><Check size={18} /> Current Plan</>
                      ) : (
                        "Not Available"
                      )}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Plans;

