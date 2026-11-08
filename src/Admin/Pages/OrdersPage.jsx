import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import CreateOrder from "../Components/CreateOrder.jsx";
import ViewOrder from "../Components/ViewOrder.jsx";

const mockOrders = [
  {
    _id: "1",
    customerName: "Jane Doe",
    customerEmail: "jane@example.com",
    shippingAddress: "123 React St, JavaScript City",
    status: "pending",
    items: [{ product: { name: "Ceramic Vase" }, quantity: 2, price: 45 }],
    totalAmount: 90,
  },
  {
    _id: "2",
    customerName: "John Smith",
    customerEmail: "john@example.com",
    shippingAddress: "456 CSS Ave, Styling Town",
    status: "paid",
    items: [{ product: { name: "Clay Mug" }, quantity: 1, price: 18 }],
    totalAmount: 18,
  },
];

function OrdersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Filtres dashboard — envoyés au backend via query params.
  // "" = pas de filtre (la valeur n'est pas envoyée si vide).
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    const fetchOrders = async () => {
      try {
        // Axios omet les params `undefined` ; on filtre pour ne JAMAIS envoyer
        // une string vide, qui serait sinon acceptée par Express mais inutile.
        const params = {};
        if (statusFilter) params.status = statusFilter;
        if (dateFilter) params.date = dateFilter;

        const response = await axiosInstance.get(`/orders/`, { params });
        setOrders(response.data);
      } catch (err) {
        setError("Failed to fetch Orders!");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [statusFilter, dateFilter]);

  useEffect(() => {
    const searchOrderId = location.state?.searchOrderId;
    if (!searchOrderId) return;

    const matchingOrder = orders.find((order) => order._id === searchOrderId);
    if (!matchingOrder) return;

    setSelectedOrder(matchingOrder);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate, orders]);

  const handleDelete = async (orderId) => {
    try {
      await axiosInstance.delete(`/orders/${orderId}`);
      setOrders(orders.filter((order) => order._id !== orderId));
      setSelectedOrder((sel) => (sel && sel._id === orderId ? null : sel));
      alert("Order deleted successfully!");
    } catch (error) {
      console.error("There was an error deleting the order!", error);
      alert(
        `Failed to delete the order: ${error.response?.data?.message || error.message}`,
      );
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    const previousStatus = orders.find((o) => o._id === orderId)?.status;
    // Optimistic update: reflect the change immediately (table + open modal)
    setOrders((current) =>
      current.map((o) =>
        o._id === orderId ? { ...o, status: newStatus } : o,
      ),
    );
    setSelectedOrder((sel) =>
      sel && sel._id === orderId ? { ...sel, status: newStatus } : sel,
    );
    try {
      await axiosInstance.patch(`/orders/${orderId}/status`, {
        status: newStatus,
      });
    } catch (error) {
      // Roll back on failure
      setOrders((current) =>
        current.map((o) =>
          o._id === orderId ? { ...o, status: previousStatus } : o,
        ),
      );
      setSelectedOrder((sel) =>
        sel && sel._id === orderId ? { ...sel, status: previousStatus } : sel,
      );
      console.error("Failed to update order status", error);
      alert(
        `Failed to update status: ${error.response?.data?.message || error.message}`,
      );
    }
  };

  const handleAddOrder = (orderData) => {
    setOrders((currentOrders) => [
      {
        ...orderData,
        _id: Date.now().toString(),
      },
      ...currentOrders,
    ]);
    setShowCreateOrder(false);
  };

  const getProductName = (item) => {
    if (typeof item.product === "object")
      return item.product?.name || "Product";

    return item.product || "Product";
  };

  // URL de la 1ère image produit (tableau `images` dans Product model).
  // - Tableau vide / pas d'image → null (on affichera un placeholder).
  // - URL absolue (http…) → on garde telle quelle (Cloudinary, etc.).
  // - Chemin relatif → on préfixe par REACT_APP_API_URL/images/.
  const getProductImage = (item) => {
    if (typeof item.product !== "object") return null;
    const images = item.product?.images;
    if (!Array.isArray(images) || images.length === 0) return null;
    const first = images[0];
    if (!first) return null;
    if (/^https?:\/\//i.test(first)) return first;
    return `${process.env.REACT_APP_API_URL}/images/${first}`;
  };

  return (
    <div>
      <div className="overflow-x-auto p-4">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1
            style={{
              fontFamily: "'Style Script', cursive",
              fontSize: "32px",
              color: "#884B2C",
            }}
          >
            Our Orders
          </h1>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            {/* Filtre statut */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="status-filter"
                className="text-sm text-gray-600"
              >
                Status:
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#A2664E]"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Filtre date (jour exact) */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="date-filter"
                className="text-sm text-gray-600"
              >
                Date:
              </label>
              <input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#A2664E]"
              />
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => setDateFilter("")}
                  className="text-xs text-gray-500 underline hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              onClick={() => setShowCreateOrder(true)}
              className="px-4 py-2 bg-[#A2664E] text-white rounded-md hover:opacity-90"
            >
              + Add Order
            </button>
          </div>
        </div>
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 text-sm text-gray-700">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Email</th>
							<th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Items</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Shipping Address</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="11"
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((order, index) => (
                  <tr
                    key={order._id}
                    onClick={() => setSelectedOrder(order)}
                    className="border-b hover:bg-[#FBF4EC] cursor-pointer"
                  >
                    <td className="px-4 py-2 text-sm">{index + 1 || 1}</td>
                    <td className="px-4 py-2 text-sm">
                      {order.customerName || "N/A"}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {order.customerEmail || "N/A"}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {order.customerPhone || "N/A"}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {order.items?.length ? (
                        <div className="flex flex-col gap-2">
                          {order.items.map((item, i) => {
                            const imgUrl = getProductImage(item);
                            return (
                              <div
                                key={i}
                                className="flex items-center gap-2"
                              >
                                {imgUrl ? (
                                  <img
                                    src={imgUrl}
                                    alt={getProductName(item)}
                                    className="h-8 w-8 rounded object-cover border border-gray-200"
                                    onError={(e) => {
                                      // Si l'image 404, on remplace par placeholder
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded border border-gray-200 bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">
                                    N/A
                                  </div>
                                )}
                                <span>
                                  {getProductName(item)} x {item.quantity}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {order.totalAmount ?? "N/A"}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <select
                        value={order.status || "pending"}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          handleStatusChange(order._id, e.target.value)
                        }
                        className="rounded-full border border-transparent px-3 py-1 text-xs font-medium capitalize outline-none focus:border-[#A2664E]"
                        style={{
                          backgroundColor:
                            order.status === "paid" ? "#dcfce7" : // green-100
                            order.status === "cancelled" ? "#fee2e2" : // red-100
                            order.status === "confirmed" ? "#dbeafe" : // blue-100
                            "#F4E5C8",
                          color:
                            order.status === "paid" ? "#15803d" :
                            order.status === "cancelled" ? "#b91c1c" :
                            order.status === "confirmed" ? "#1e40af" : // blue-800
                            "#884B2C",
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
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {order.shippingAddress || "N/A"}
                    </td>
                    <td className="px-4 py-2 text-center text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(order._id);
                        }}
                        className="text-red-600 hover:text-red-800 font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="px-4 py-4 text-center text-gray-500"
                  >
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showCreateOrder && (
        <CreateOrder
          onClose={() => setShowCreateOrder(false)}
          onAddOrder={handleAddOrder}
        />
      )}
      {selectedOrder && (
        <ViewOrder
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onDelete={(orderId) => {
            handleDelete(orderId);
          }}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

export default OrdersPage;
