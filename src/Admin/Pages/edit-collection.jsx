import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";

function EditCollection() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "",
  });

  const [products, setProducts] = useState([]);
  // Multi-sélection : array d'IDs produits cochés.
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  // Recherche live au-dessus de la liste produits.
  const [productSearch, setProductSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch collection and products on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError("");

        // Fetch collection details
        const collectionResponse = await axiosInstance.get(`/collections/${id}`);
        const collectionData = collectionResponse.data;

        // Fetch all products for selection
        const productsResponse = await axiosInstance.get("/products/");
        const productsData = productsResponse.data;

        // Set form data
        setForm({
          name: collectionData.name || "",
          description: collectionData.description || "",
          image: collectionData.image || "",
        });

        // Set selected product IDs (multi) depuis la collection populée.
        // Le backend renvoie un array d'objets Product populés.
        const initialSelected = Array.isArray(collectionData.products)
          ? collectionData.products.map((p) => p._id)
          : [];
        setSelectedProductIds(initialSelected);

        // Set products list for UI
        setProducts(productsData);

        // Set preview image if exists
        if (collectionData.image) {
          setPreviewUrl(collectionData.image);
        }
      } catch (err) {
        console.error("Failed to fetch collection data:", err);
        setError("Failed to load collection data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // INPUT CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
    if (success) setSuccess("");
  };

  // IMAGE
  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
    if (error) setError("");
    if (success) setSuccess("");
  };

  // TOGGLE un produit dans la sélection multiple.
  // Limite MAX_SELECTION : on ne peut pas ajouter au-delà, mais on peut toujours
  // DÉCOCHER pour libérer une place.
  const MAX_SELECTION = 10;
  const toggleProduct = (productId) => {
    setSelectedProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= MAX_SELECTION) {
        setError(`You can select up to ${MAX_SELECTION} products per collection.`);
        return prev;
      }
      return [...prev, productId];
    });
    if (error) setError("");
    if (success) setSuccess("");
  };

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!form.name.trim()) {
      setError("Collection name is required");
      return;
    }

    // Clear previous messages
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Prepare FormData
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("description", form.description.trim());

      // Add image file if selected (new image)
      if (selectedFile) {
        formData.append("image", selectedFile);
      }
      // If no new image selected but we want to keep existing, we don't need to send anything
      // The backend will handle preserving the existing image if not provided in the request

      // Add selected product IDs (multi). On envoie un append par ID ; multer
      // produit un array accessible via req.body.products côté backend.
      selectedProductIds.forEach((id) => {
        formData.append("products", id);
      });

      // Make API call
      const response = await axiosInstance.put(`/collections/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Collection updated successfully!");

      // Close modal after delay to show success message
      setTimeout(() => {
        navigate("/collections");
      }, 1500);
    } catch (err) {
      console.error("Failed to update collection:", err);
      const message = err.response?.data?.message ||
                     err.response?.data?.error ||
                     err.message ||
                     "Failed to update collection";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading collection data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p className="font-bold">Error</p>
          <p className="mt-2">{error}</p>
        </div>
        <div className="text-center mt-6">
          <button
            onClick={() => navigate(`/view-collection/${id}`)}
            className="px-4 py-2 bg-[#A2664E] text-white rounded-md hover:opacity-90"
          >
            Back to Collection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* TITLE */}
      <h1
        className="mb-6"
        style={{
          fontFamily: "'Style Script', cursive",
          fontSize: "32px",
          color: "#884B2C",
        }}
      >
        Edit Collection
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

      {/* FORM CARD */}
      <div className="max-w-3xl bg-white shadow-md rounded-lg p-6 border">

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* NAME */}
          <div>
            <label className="block text-sm mb-2 text-gray-700">
              Collection Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="Collection name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border rounded-md outline-none focus:border-[#A2664E]"
              required
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-sm mb-2 text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              placeholder="Description"
              rows="4"
              value={form.description}
              onChange={handleChange}
              className="w-full px-4 py-3 border rounded-md outline-none focus:border-[#A2664E]"
            />
          </div>

          {/* IMAGE UPLOAD */}
          <div>
            <label className="block text-sm mb-2 text-gray-700">
              Collection Image
            </label>
            <div className="flex items-center gap-4">
              <label className="px-4 py-2 bg-[#A2664E] text-white rounded-md cursor-pointer hover:opacity-90">
                Choose Image
                <input type="file" onChange={handleImage} className="hidden" accept="image/*" />
              </label>

              <span className="text-sm text-gray-600">
                {selectedFile ? selectedFile.name : "No image selected (keep current)"}
              </span>
            </div>

            {/* IMAGE PREVIEW */}
            {previewUrl && (
              <div className="mt-4">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-48 h-48 object-cover rounded border"
                />
              </div>
            )}
          </div>

          {/* PRODUCT SELECTION (MULTI) */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="font-medium text-gray-700">
                Select Products
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({selectedProductIds.length}/{MAX_SELECTION} selected)
                </span>
              </p>
              {selectedProductIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedProductIds([])}
                  className="text-xs text-gray-500 underline hover:text-gray-700"
                >
                  Clear selection
                </button>
              )}
            </div>

            {/* RECHERCHE LIVE */}
            <div className="mb-3">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products by name or category..."
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#A2664E]"
              />
            </div>

            {products.length > 0 ? (
              (() => {
                // Filtre live sur name + categoryName.
                const q = productSearch.trim().toLowerCase();
                const filtered = q
                  ? products.filter((p) => {
                      const name = (p.name || "").toLowerCase();
                      const cat =
                        typeof p.category === "object"
                          ? (p.category?.name || "").toLowerCase()
                          : (p.category || "").toLowerCase();
                      return name.includes(q) || cat.includes(q);
                    })
                  : products;
                if (filtered.length === 0) {
                  return (
                    <p className="text-sm text-gray-500 text-center py-4 border rounded-md">
                      No products match “{productSearch}”.
                    </p>
                  );
                }
                return (
                  <div className="border rounded-md p-4 max-h-80 overflow-y-auto">
                    <div className="space-y-2">
                      {filtered.map((product) => {
                        const isSelected = selectedProductIds.includes(product._id);
                        const limitReached =
                          selectedProductIds.length >= MAX_SELECTION && !isSelected;
                        return (
                          <div
                            key={product._id}
                            className={`flex items-center gap-3 p-3 rounded border ${
                              limitReached
                                ? "border-gray-200 opacity-50 cursor-not-allowed"
                                : isSelected
                                  ? "border-[#A2664E] bg-[#F0F9FF] cursor-pointer"
                                  : "border-gray-200 hover:bg-gray-50 cursor-pointer"
                            }`}
                            onClick={() => !limitReached && toggleProduct(product._id)}
                          >
                            {/* CHECKBOX */}
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={limitReached}
                              onChange={() => toggleProduct(product._id)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-4 w-4 text-[#A2664E] border-gray-300 rounded disabled:cursor-not-allowed"
                            />

                            {/* PRODUCT INFO */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                {product.pubImage && (
                                  <img
                                    src={product.pubImage}
                                    alt={product.name}
                                    className="w-10 h-10 object-cover rounded border"
                                  />
                                )}
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {product.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {typeof product.category === "object"
                                      ? product.category?.name || "No category"
                                      : product.category || "No category"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No products available
              </p>
            )}

            {selectedProductIds.length >= MAX_SELECTION && (
              <p className="mt-2 text-xs text-amber-700">
                Maximum {MAX_SELECTION} products reached. Uncheck a product to choose another.
              </p>
            )}
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(`/view-collection/${id}`)}
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
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default EditCollection;