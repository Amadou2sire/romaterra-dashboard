import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";

function CreateProduct({ onClose, onSaved, product }) {
  const navigate = useNavigate();

  // ���� �� �� 🧠 CATEGORY LIST
  const categories = ["Decoration", "Mugs", "Plates", "Bowls"];

  // ���� �� �� 🧠 COLLECTION LIST (TEMP — later replace with API from your collection page)
  const collections = [
    "Summer Collection",
    "New Arrival",
    "Best Sellers",
    "Handmade Collection",
  ];

  const [form, setForm] = useState({
    images: [],
    name: "",
    description: "",
    price: "",
    promoPrice: "",
    quantityInStock: "",
    size: "",
    category: null,
    collection: null,
    status: "Available",
  });

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState(["Decoration", "Mugs", "Plates", "Bowls"]);
  const [collectionOptions, setCollectionOptions] = useState([
    "Summer Collection",
    "New Arrival",
    "Best Sellers",
    "Handmade Collection",
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const previews = images.map((file) => ({
      src: URL.createObjectURL(file),
      name: file.name,
    }));
    setImagePreviews(previews);

    return () => previews.forEach((preview) => URL.revokeObjectURL(preview.src));
  }, [images]);

  // Fetch categories and collections on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axiosInstance.get("/categories/");
        setCategoryOptions(response.data.map(cat => cat.name));
      } catch {
        // keep hardcoded
        setCategoryOptions(["Decoration", "Mugs", "Plates", "Bowls"]);
      }
    };

    const fetchCollections = async () => {
      try {
        const response = await axiosInstance.get("/collections/");
        setCollectionOptions(response.data.map(col => col.name));
      } catch {
        // keep hardcoded
        setCollectionOptions([
          "Summer Collection",
          "New Arrival",
          "Best Sellers",
          "Handmade Collection",
        ]);
      }
    };

    fetchCategories();
    fetchCollections();
  }, []);

  // INPUT HANDLER
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
      ...(name === "status" && value !== "Promo" ? { promoPrice: null } : {}),
    }));
    // Clear error when user starts typing
    if (error) setError("");
    if (success) setSuccess("");
  };

  // IMAGES HANDLER
  const handleImages = (e) => {
    setImages(Array.from(e.target.files));
    // Clear error when user selects new images
    if (error) setError("");
    if (success) setSuccess("");
  };

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors and success messages
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Prepare FormData for file uploads
      const formData = new FormData();

      // Add regular form fields
      formData.append("name", form.name);
      formData.append("description", form.description);
      if (form.price !== null && form.price !== "") {
        formData.append("price", String(form.price));
      }
      if (form.promoPrice !== null && form.promoPrice !== "") {
        formData.append("promoPrice", String(form.promoPrice));
      }
      if (form.quantityInStock !== null && form.quantityInStock !== "") {
        formData.append("quantityInStock", String(form.quantityInStock));
      }
      if (form.size) {
        formData.append("size", form.size);
      }
      if (form.category) {
        formData.append("category", form.category);
      }
      if (form.collection) {
        formData.append("collection", form.collection);
      }
      formData.append("status", form.status);

      // Add images if any
      if (images && images.length > 0) {
        images.forEach((image) => {
          formData.append("images", image);
        });
      }

      if (product?._id) {
        // Update product
        await axiosInstance.put(`/products/${product._id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        setSuccess("Product updated successfully!");
      } else {
        // Create product
        await axiosInstance.post("/products/", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        setSuccess("Product created successfully!");
        // Reset form after successful creation
        setForm({
          images: [],
          name: "",
          description: "",
          price: "",
          promoPrice: "",
          quantityInStock: "",
          size: "",
          category: null,
          collection: null,
          status: "Available",
        });
        setImages([]);
        // Clear image previews
        if (window) {
          // Revoke object URLs to prevent memory leaks
          // Note: In practice, we'd need to track these, but for simplicity we'll rely on component unmount
        }
      }

      // Notify parent to refresh product list
      onSaved?.();

      // Close form after a short delay to show success message
      setTimeout(() => {
        onClose?.();
      }, 1500);
    } catch (err) {
      // Extract error message from response
      const message = err.response?.data?.message ||
                     err.response?.data?.error ||
                     err.message ||
                     "An unexpected error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (product) {
      setExistingImages(
        Array.isArray(product.images)
          ? product.images
          : product.images
            ? [product.images]
            : [],
      );
      setForm({
        images: [],
        name: product.name,
        description: product.description,
        price: product.price,
        promoPrice: product.promoPrice,
        quantityInStock: product.quantityInStock,
        size: product.size,
        category: product.category?.name || "",
        collection: product.collection?.name || "",
        status: product.status,
      });
    } else {
      setExistingImages([]);
    }
  }, [product]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center pb-4
      bg-white/30 backdrop-blur-sm transition-transform z-50"
    >
      {/* FORM CARD */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white shadow-md rounded-lg px-4 py-6 sm:px-6 sm:py-8 border overflow-y-auto">
        {/* TITLE */}
        <h1
          className="mb-6"
          style={{
            fontFamily: "'Style Script', cursive",
            fontSize: "32px",
            color: "#884B2C",
          }}
        >
          {product ? "Edit" : "Create"} Product
        </h1>

        {/* SUCCESS MESSAGE */}
        {success && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* NAME */}
          <input
            type="text"
            name="name"
            placeholder="Product name"
            value={form.name}
            onChange={handleChange}
            className="px-4 py-3 border rounded-md outline-none focus:border-[#A2664E]"
            required
          />

          {/* DESCRIPTION */}
          <textarea
            name="description"
            placeholder="Product description"
            value={form.description}
            onChange={handleChange}
            rows="4"
            className="px-4 py-3 border rounded-md outline-none focus:border-[#A2664E]"
          />

          {/* PRICE + PROMO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="number"
              name="price"
              placeholder="Price"
              value={form.price}
              onChange={handleChange}
              className="px-4 py-3 border rounded-md outline-none focus:border-[#A2664E]"
              required
            />

            <input
              type="number"
              name="promoPrice"
              placeholder="Promo price (optional)"
              value={form.promoPrice}
              onChange={handleChange}
              disabled={form.status !== "Promo"}
              className={`px-4 py-3 border rounded-md outline-none focus:border-[#A2664E] ${
                form.status !== "Promo"
                  ? "cursor-not-allowed bg-gray-100 text-gray-400"
                  : ""
              }`}
            />
          </div>

          {/* SIZE + QTY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="size"
              placeholder="Size (e.g. 23×10 cm)"
              value={form.size}
              onChange={handleChange}
              className="px-4 py-3 border rounded-md outline-none focus:border-[#A2664E]"
            />

            <input
              type="number"
              name="quantityInStock"
              placeholder="Quantity in Stock"
              value={form.quantityInStock}
              onChange={handleChange}
              className="px-4 py-3 border rounded-md outline-none focus:border-[#A2664E]"
            />
          </div>

          {/* CATEGORY */}
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="px-4 py-3 border rounded-md outline-none focus:border-[#A2664E]"
          >
            <option value="">Select Category</option>
            {categoryOptions.map((cat, i) => (
              <option key={i} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* COLLECTION (IMPORTANT PART) */}
          <select
            name="collection"
            value={form.collection}
            onChange={handleChange}
            className="px-4 py-3 border rounded-md outline-none focus:border-[#A2664E]"
          >
            <option value="">Select Collection</option>
            {collectionOptions.map((col, i) => (
              <option key={i} value={col}>
                {col}
              </option>
            ))}
          </select>

          {/* STATE */}
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="px-4 py-3 border rounded-md outline-none focus:border-[#A2664E]"
          >
            <option value="Available">Available</option>
            <option value="Promo">Promo</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>

          {/* IMAGES */}
          <div>
            <label className="block text-sm mb-2 text-gray-700">
              Product Images (select multiple to add)
            </label>
            <input
              type="file"
              multiple
              onChange={handleImages}
              className="w-full px-4 py-2 border rounded-md focus:border-[#A2664E]"
            />
            {existingImages.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Current images ({existingImages.length})
                </p>
                <div className="flex flex-wrap gap-3">
                  {existingImages.map((image, index) => (
                    <div key={`${image}-${index}`} className="flex flex-col items-center">
                      <img
                        src={image}
                        alt={form.name || "Product"}
                        className="h-24 w-24 rounded border bg-white object-contain"
                      />
                      <span className="mt-1 text-xs text-gray-600">Current {index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {images.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-gray-700">
                  New images ({images.length})
                </p>
                <div className="flex flex-wrap gap-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={`${preview.name}-${index}`} className="flex flex-col items-center">
                      <img
                        src={preview.src}
                        alt={`${form.name || "Product"} preview ${index + 1}`}
                        className="h-24 w-24 rounded border bg-white object-contain"
                      />
                      <span className="mt-1 text-xs text-gray-600">New {index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
          )}
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`px-4 py-2 border rounded-md hover:bg-gray-100 ${
                loading ? "cursor-not-allowed opacity-50" : ""
              }`}
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
              {loading ? "Saving..." : product ? "Edit" : "Create"} Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateProduct;