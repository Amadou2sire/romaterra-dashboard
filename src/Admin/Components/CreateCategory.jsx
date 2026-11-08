import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";

function CreateCategory({ onClose, onSuccess }) {
  const navigate = useNavigate();

  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!categoryName.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await axiosInstance.post("/categories/", { name: categoryName });
      console.log("Category created:", response.data);

      // reset
      setCategoryName("");

      // Call onSuccess if provided (parent can handle closing modal and refetching)
      if (onSuccess) onSuccess();
      // Always close the modal on success
      onClose();
    } catch (err) {
      console.error("Failed to create category:", err);
      setError(err.response?.data?.message || "Failed to create category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center pb-4
      bg-white/30 backdrop-blur-sm transition-transform z-50"
    >
      {/* FORM CARD */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white shadow-md rounded-lg px-4 py-6 sm:px-6 sm:py-8 border overflow-y-auto">
        {/* TITLE */}
        <h1
          className="mb-6"
          style={{
            fontFamily: "'Style Script', cursive",
            fontSize: "32px",
            color: "#884B2C",
          }}
        >
          Create Category
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* CATEGORY NAME */}
          <div>
            <label className="block text-sm mb-2 text-gray-700">
              Category Name
            </label>

            <input
              type="text"
              placeholder="Enter category name..."
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full px-4 py-3 rounded-md border border-gray-300 outline-none focus:border-[#A2664E]"
            />
          </div>

          {/* BUTTONS */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 bg-[#A2664E] text-white rounded-md hover:opacity-90 ${
                loading ? "cursor-not-allowed opacity-50" : ""
              }`}
            >
              {loading ? "Saving..." : "Save Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateCategory;