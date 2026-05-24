function HistoryModal({
  isOpen,
  onClose,
  historyData
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex justify-center items-center z-50 backdrop-blur-sm">
      <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 sm:p-6 rounded-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Vehicle History</h2>
          <button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 min-h-[44px] rounded-lg font-medium transition-all text-sm"
          >
            Close
          </button>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="text-left p-3 text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider">Vehicle</th>
              <th className="text-left p-3 text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider">Owner</th>
              <th className="text-left p-3 text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider">Expiry</th>
              <th className="text-left p-3 text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider hidden sm:table-cell">Updated At</th>
            </tr>
          </thead>
          <tbody>
            {historyData.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-10 text-center text-gray-400 dark:text-gray-500">No history found</td>
              </tr>
            ) : (
              historyData.map((item, index) => (
                <tr key={index} className="border-b border-gray-200 dark:border-gray-800/50 hover:bg-gray-100/30 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="p-3 text-gray-900 dark:text-white font-medium">{item.vehicle_number}</td>
                  <td className="p-3 text-gray-700 dark:text-gray-300">{item.owner}</td>
                  <td className="p-3 text-gray-700 dark:text-gray-300">{item.expiry_date}</td>
                  <td className="p-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">{item.edited_at}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

export default HistoryModal;