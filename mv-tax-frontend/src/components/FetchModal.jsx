import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, CheckCircle, AlertTriangle, X } from "lucide-react";

function FetchModal({ isOpen, onClose, vehicleNumber, logs, loading, error }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 dark:bg-black/70 flex justify-center items-center z-50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 sm:p-6 rounded-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col shadow-2xl"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              {loading ? (
                <RefreshCw size={22} className="text-purple-400 animate-spin" />
              ) : error ? (
                <AlertTriangle size={22} className="text-red-400" />
              ) : (
                <CheckCircle size={22} className="text-green-400" />
              )}
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {loading ? "Fetching..." : error ? "Fetch Failed" : "Fetch Complete"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-3 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
            <span className="font-semibold text-gray-700 dark:text-gray-300">{vehicleNumber}</span>
            {loading && (
              <span className="inline-flex items-center gap-1.5 text-purple-400">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                Fetching from Parivahan...
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto mb-4 min-h-0">
            <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4 font-mono text-xs leading-relaxed max-h-[50vh] overflow-y-auto">
              {logs.length === 0 && loading ? (
                <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 py-4">
                  <RefreshCw size={14} className="animate-spin" />
                  Waiting for output...
                </div>
              ) : (
                logs.map((line, i) => (
                  <div
                    key={i}
                    className={`${
                      line.startsWith("ERROR") || line.toLowerCase().includes("error")
                        ? "text-red-400"
                        : line.startsWith("CAPTCHA")
                        ? "text-yellow-400"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {line}
                  </div>
                ))
              )}
              {loading && (
                <span className="inline-block w-2 h-4 bg-purple-400 animate-pulse ml-1" />
              )}
            </div>
          </div>

          {error && !loading && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 mb-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-300">Error</p>
                <p className="text-xs text-red-400 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-800">
            {!loading && (
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all"
              >
                Close
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default FetchModal;
