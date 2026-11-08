import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";

function ViewCollection() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCollection = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError("");
        const response = await axiosInstance.get(`/collections/${id}`);
        setCollection(response.data);
      } catch (err) {
        console.error("Failed to fetch collection:", err);
        setError("Failed to load collection details.");
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading collection details...</p>
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
        <div className="text-center">
          <button
            onClick={() => navigate("/collections")}
            className="px-4 py-2 bg-[#A2664E] text-white rounded-md hover:opacity-90"
          >
            Back to Collections
          </button>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Collection not found.</p>
          <div className="mt-6">
            <button
              onClick={() => navigate("/collections")}
              className="px-4 py-2 bg-[#A2664E] text-white rounded-md hover:opacity-90"
            >
              Back to Collections
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ImageKit renvoie des URLs absolues (https://ik.imagekit.io/...).
  // Le Product model stocke un ARRAY `images` (pas `image`).
  // On accepte ici : une string, un array (on prend la 1ère), un objet populé `{ images: [...] }`.
  const getImageUrl = (input) => {
    let url = null;
    if (Array.isArray(input)) {
      url = input[0];
    } else if (input && typeof input === "object" && Array.isArray(input.images)) {
      url = input.images[0];
    } else if (typeof input === "string") {
      url = input;
    }
    if (!url) return "https://via.placeholder.com/64";
    if (url.startsWith("http")) return url;
    return "https://via.placeholder.com/64";
  };

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
        Collection Details
      </h1>

      {/* MAIN CARD */}
      <div className="bg-white shadow-md rounded-lg p-6 border">

        {/* TOP SECTION */}
        <div className="flex flex-col md:flex-row gap-6">

          {/* IMAGE */}
          <div className="w-full md:w-64">
            <img
              src={getImageUrl(collection.image)}
              alt={collection.name || "Collection"}
              className="w-full h-64 object-cover rounded-lg border"
            />
          </div>

          {/* INFO */}
          <div className="flex flex-col justify-between w-full">

            <div>
              <h2 className="text-2xl font-bold text-[#884B2C] mb-2">
                {collection.name || "Untitled Collection"}
              </h2>

              {collection.description && (
                <p className="text-gray-600 mb-3">
                  {collection.description}
                </p>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex gap-3 mt-4">

              <button
                onClick={() => navigate(`/edit-collection/${collection._id}`)}
                className="px-4 py-2 bg-[#A2664E] text-white rounded-md hover:opacity-90"
              >
                Edit
              </button>

              <button
                onClick={() => navigate("/collections")}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
              >
                Back
              </button>

            </div>
          </div>
        </div>

        {/* PRODUCT SECTION */}
        {Array.isArray(collection.products) && collection.products.length > 0 && (
          <div className="mt-8">

            <h3 className="text-lg font-semibold text-[#884B2C] mb-4">
              Products in this collection ({collection.products.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {collection.products.map((product) => (
                <div
                  key={product._id}
                  className="border rounded-lg p-3 hover:shadow transition"
                >
                  <img
                    src={getImageUrl(product)}
                    alt={product.name || "Product"}
                    className="w-full h-48 object-cover rounded mb-2"
                    onError={(e) => {
                      e.currentTarget.src = "https://via.placeholder.com/64";
                    }}
                  />

                  <p className="text-sm font-medium text-gray-900">
                    {product.name || "Unnamed Product"}
                  </p>

                  {product.price !== undefined && (
                    <p className="text-xs text-gray-600">
                      {product.price} TND
                    </p>
                  )}
                </div>
              ))}
            </div>

          </div>
        )}

        {/* EMPTY STATE */}
        {(!Array.isArray(collection.products) || collection.products.length === 0) && (
          <div className="mt-8 text-center py-8">
            <p className="text-gray-500">No product in this collection.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewCollection;