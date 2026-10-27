import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";

// Admin page to configure the flat shipping fee applied to all orders.
function ShippingSettingsPage() {
  const [fee, setFee] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    let active = true;
    axiosInstance
      .get("/settings/shipping")
      .then(({ data }) => {
        if (active) setFee(String(data.fee ?? 0));
      })
      .catch(() => {
        if (active) setMessage({ type: "error", text: "Failed to load shipping settings." });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = Number(fee);
    if (Number.isNaN(value) || value < 0) {
      setMessage({ type: "error", text: "Please enter a valid fee (0 or more)." });
      return;
    }
    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      await axiosInstance.put("/settings/shipping", { fee: value });
      setMessage({ type: "success", text: "Shipping fee saved!" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to save shipping settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <h1
        className="mb-6"
        style={{
          fontFamily: "'Style Script', cursive",
          fontSize: "32px",
          color: "#884B2C",
        }}
      >
        Delivery Settings
      </h1>

      {message.text && (
        <div
          className={`mb-4 rounded-md border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="max-w-lg rounded-lg border bg-white p-6 shadow-md">
        {loading ? (
          <p className="text-sm text-gray-500">Loading shipping settings...</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Livraison (DT)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                placeholder="Ex : 8"
                className="w-full rounded-md border px-4 py-3 outline-none focus:border-[#A2664E]"
              />
              <p className="mt-1 text-xs text-gray-400">
                Frais de livraison fixe appliqué à toutes les commandes.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className={`self-start rounded-md px-6 py-3 text-white transition ${
                saving ? "bg-gray-400 cursor-not-allowed" : "bg-[#A2664E] hover:opacity-90"
              }`}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ShippingSettingsPage;