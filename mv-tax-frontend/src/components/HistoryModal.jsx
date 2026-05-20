function HistoryModal({
  isOpen,
  onClose,
  historyData
}) {

  if (!isOpen) return null;

  return (

    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">

      <div className="bg-white p-6 rounded-2xl w-[700px] max-h-[80vh] overflow-y-auto">

        <div className="flex justify-between items-center mb-6">

          <h2 className="text-2xl font-bold">
            Vehicle History
          </h2>

          <button
            onClick={onClose}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Close
          </button>

        </div>

        <table className="w-full">

          <thead>

            <tr className="border-b">

              <th className="text-left p-3">
                Owner
              </th>

              <th className="text-left p-3">
                Expiry
              </th>

              <th className="text-left p-3">
                Updated At
              </th>

            </tr>

          </thead>

          <tbody>

            {historyData.map((item, index) => (

              <tr
                key={index}
                className="border-b"
              >

                <td className="p-3">
                  {item.owner}
                </td>

                <td className="p-3">
                  {item.expiry_date}
                </td>

                <td className="p-3">
                  {item.edited_at}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

}

export default HistoryModal;
