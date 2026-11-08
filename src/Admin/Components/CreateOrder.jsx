import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function CreateOrder({ onClose, onAddOrder }) {
  const navigate = useNavigate();

  const productsList = [
    { _id: "1", name: "Ceramic Vase", price: 45 },
    { _id: "2", name: "Clay Mug", price: 18 },
    { _id: "3", name: "Handmade Plate", price: 28 },
  ];

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    shippingAddress: "",
    status: "pending",
  });

  const [items, setItems] = useState([
    {
      product: "",
      quantity: 1,
      price: "",
    },
  ]);

  const totalAmount = useMemo(() => {
    return items.reduce((total, item) => {
      return total + Number(item.quantity || 0) * Number(item.price || 0);
    }, 0);
  }, [items]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index, field, value) => {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        if (field === "product") {
          const selectedProduct = productsList.find(
            (product) => product._id === value,
          );

          return {
            ...item,
            product: value,
            price: selectedProduct ? selectedProduct.price : "",
          };
        }

        return {
          ...item,
          [field]: value,
        };
      }),
    );
  };

  const addItem = () => {
    setItems((currentItems) => [
      ...currentItems,
      { product: "", quantity: 1, price: "" },
    ]);
  };

  const removeItem = (index) => {
    setItems((currentItems) =>
      currentItems.length === 1
        ? currentItems
        : currentItems.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const orderData = {
      ...form,
      items: items.map((item) => ({
        product: item.product,
        quantity: Number(item.quantity),
        price: Number(item.price),
      })),
      totalAmount,
    };

    console.log("ORDER CREATED:", orderData);

    if (onAddOrder) onAddOrder(orderData);
    navigate("/orders");
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center pb-4
      bg-white/30 backdrop-blur-sm transition-transform z-50"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] flex-col overflow-y-auto rounded-lg border bg-white px-4 py-6 sm:px-6 sm:py-8 shadow-md">
        <h1
          className="mb-6"
          style={{
            fontFamily: "'Style Script', cursive",
            fontSize: "32px",
            color: "#884B2C",
          }}
        >
          Create Order
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              type="text"
              name="customerName"
              placeholder="Customer name"
              value={form.customerName}
              onChange={handleChange}
              required
              className="rounded-md border px-4 py-3 outline-none focus:border-[#A2664E]"
            />

            <input
              type="email"
              name="customerEmail"
              placeholder="Customer email"
              value={form.customerEmail}
              onChange={handleChange}
              required
              className="rounded-md border px-4 py-3 outline-none focus:border-[#A2664E]"
            />
          </div>

          <textarea
            name="shippingAddress"
            placeholder="Shipping address"
            value={form.shippingAddress}
            onChange={handleChange}
            rows="3"
            required
            className="rounded-md border px-4 py-3 outline-none focus:border-[#A2664E]"
          />

          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="rounded-md border px-4 py-3 outline-none focus:border-[#A2664E]"
          >
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-medium text-[#884B2C]">Order Items</p>

              <button
                type="button"
                onClick={addItem}
                className="rounded-md bg-[#A2664E] px-3 py-2 text-sm text-white hover:opacity-90"
              >
                + Add Item
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-[1fr_120px_120px_auto]"
                >
                  <select
                    value={item.product}
                    onChange={(e) =>
                      handleItemChange(index, "product", e.target.value)
                    }
                    required
                    className="rounded-md border px-4 py-3 outline-none focus:border-[#A2664E]"
                  >
                    <option value="">Select Product</option>
                    {productsList.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(index, "quantity", e.target.value)
                    }
                    required
                    className="rounded-md border px-4 py-3 outline-none focus:border-[#A2664E]"
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) =>
                      handleItemChange(index, "price", e.target.value)
                    }
                    required
                    className="rounded-md border px-4 py-3 outline-none focus:border-[#A2664E]"
                  />

                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="rounded-md border border-red-200 px-4 py-2 text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md bg-[#F4E5C8] px-4 py-3 text-right font-semibold text-[#884B2C]">
            Total: {totalAmount.toFixed(2)}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border px-4 py-2 hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-md bg-[#A2664E] px-4 py-2 text-white hover:opacity-90"
            >
              Create Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateOrder;
