import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, X } from "lucide-react";

function CaptchaModal({ isOpen, onClose, captchaImage, vehicleNumber, onSubmit }) {
  const [captchaInput, setCaptchaInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!captchaInput.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(captchaInput.trim());
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl w-full max-w-md mx-4 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <ShieldAlert size={22} className="text-yellow-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                CAPTCHA Required
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Parivahan requires CAPTCHA verification for{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-300">{vehicleNumber}</span>.
            Please enter the text shown in the image below.
          </p>

          {captchaImage && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 mb-4 flex justify-center border border-gray-200 dark:border-gray-700">
              <img
                src={`data:image/png;base64,${captchaImage}`}
                alt="CAPTCHA"
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          )}

          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Enter CAPTCHA text"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-mono tracking-widest uppercase"
              autoFocus
              maxLength={10}
            />
            <button
              onClick={handleSubmit}
              disabled={submitting || !captchaInput.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold transition-all"
            >
              {submitting ? "Verifying..." : "Submit CAPTCHA"}
            </button>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-center">
            This is a human-in-the-loop verification. Your input is not stored.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CaptchaModal;
