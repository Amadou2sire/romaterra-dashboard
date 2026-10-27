function ConfirmAlert({ title, message, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pb-4 bg-black/30">
      <div className="relative w-full max-w-md max-h-[90vh] rounded-lg bg-white px-4 py-6 sm:px-6 sm:py-8 shadow-lg overflow-y-auto">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mb-6 text-sm text-gray-600">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-md border px-4 py-2 hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-md px-4 py-2 text-white ${
              loading
                ? "cursor-not-allowed bg-red-300"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmAlert;
