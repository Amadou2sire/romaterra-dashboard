import React from "react";

// Modal "read-only" qui affiche toutes les informations d'une commande.
// Ouvert depuis OrdersPage au clic sur une ligne du tableau.
function ViewOrder({ order, onClose, onDelete, onStatusChange }) {
  const getProductName = (item) => {
    if (typeof item.product === "object") return item.product?.name || "Product";
    return item.product || "Product";
  };

  // 1ère image du produit (Product.images). URL absolue gardée telle quelle ;
  // chemin relatif préfixé par REACT_APP_API_URL/images/.
  const getProductImage = (item) => {
    if (typeof item.product !== "object") return null;
    const images = item.product?.images;
    if (!Array.isArray(images) || images.length === 0) return null;
    const first = images[0];
    if (!first) return null;
    if (/^https?:\/\//i.test(first)) return first;
    return `${process.env.REACT_APP_API_URL}/images/${first}`;
  };

  const statusColor =
    order.status === "paid"
      ? "bg-green-100 text-green-700"
      : order.status === "cancelled"
        ? "bg-red-100 text-red-700"
        : order.status === "confirmed"
          ? "bg-blue-100 text-blue-800"
          : "bg-[#F4E5C8] text-[#884B2C]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Détails de la commande
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-4">
          {/* Statut */}
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Référence : <span className="font-mono">{order._id}</span>
            </span>
            {onStatusChange ? (
              <select
                value={order.status || "pending"}
                onChange={(e) => onStatusChange(order._id, e.target.value)}
                className="rounded-full border border-transparent px-3 py-1 text-xs font-medium capitalize outline-none focus:border-[#A2664E]"
                style={{
                  backgroundColor:
                    order.status === "paid"
                      ? "#dcfce7"
                      : order.status === "cancelled"
                        ? "#fee2e2"
                        : order.status === "confirmed"
                          ? "#dbeafe"
                          : "#F4E5C8",
                  color:
                    order.status === "paid"
                      ? "#15803d"
                      : order.status === "cancelled"
                        ? "#b91c1c"
                        : order.status === "confirmed"
                          ? "#1e40af"
                          : "#884B2C",
                }}
              >
                <option value="pending" style={{ color: "#884B2C" }}>
                  Pending
                </option>
                <option value="confirmed" style={{ color: "#1e40af" }}>
                  Confirmed
                </option>
                <option value="paid" style={{ color: "#15803d" }}>
                  Paid
                </option>
                <option value="cancelled" style={{ color: "#b91c1c" }}>
                  Cancelled
                </option>
              </select>
            ) : (
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusColor}`}
              >
                {order.status || "pending"}
              </span>
            )}
          </div>

          {/* Client */}
          <div className="mb-5 rounded-md border bg-gray-50 p-4 text-sm">
            <h3 className="mb-2 font-semibold text-gray-700">Client</h3>
            <p className="text-gray-600">{order.customerName || "N/A"}</p>
            <p className="text-gray-600">{order.customerEmail || "N/A"}</p>
            <p className="text-gray-600">
              Téléphone : {order.customerPhone || "N/A"}
            </p>
            <p className="text-gray-600">
              Adresse : {order.shippingAddress || "N/A"}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Créée le : {order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}
            </p>
          </div>

          {/* Articles */}
          <h3 className="mb-2 font-semibold text-gray-700">Articles</h3>
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-100 text-left text-gray-600">
                <th className="px-3 py-2">Produit</th>
                <th className="px-3 py-2 text-center">Qté</th>
                <th className="px-3 py-2 text-right">Prix</th>
                <th className="px-3 py-2 text-right">Sous-total</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item, i) => {
                const imgUrl = getProductImage(item);
                return (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={getProductName(item)}
                            className="h-10 w-10 rounded object-cover border border-gray-200"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded border border-gray-200 bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">
                            N/A
                          </div>
                        )}
                        <span>{getProductName(item)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">{item.quantity}</td>
                    <td className="px-3 py-2 text-right">{item.price} DT</td>
                    <td className="px-3 py-2 text-right font-medium">
                      {(item.price || 0) * item.quantity} DT
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Total */}
          <div className="mt-4 flex justify-between rounded-md border px-4 py-3 text-base font-semibold text-gray-800">
            <span>Total de la commande</span>
            <span>{order.totalAmount ?? 0} DT</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          {onDelete && (
            <button
              onClick={() => onDelete(order._id)}
              className="px-4 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
            >
              Supprimer
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-100"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

export default ViewOrder;