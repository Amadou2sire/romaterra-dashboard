import React, { useEffect, useState } from "react";
import CreateProduct from "./FormProduct.jsx";

function ViewProduct({ product, onClose }) {
  const [editProduct, setEditProduct] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const images = Array.isArray(product.images)
    ? product.images
    : product.images
      ? [product.images]
      : [];
  const firstImage = images[0] || "";
  const activeImage = images[activeImageIndex] || images[0] || "";

  useEffect(() => {
    setActiveImageIndex(0);
  }, [product._id, firstImage]);

  const HandelEditProduct = () => {
    setEditProduct(true);
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center pb-4
      bg-white/30 backdrop-blur-sm transition-transform z-50"
    >
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white shadow-md rounded-lg px-4 py-6 sm:px-6 sm:py-8 border overflow-y-auto">
        {/* TITLE */}
        <h1
          className="mb-6 text-center"
          style={{
            fontFamily: "'Style Script', cursive",
            fontSize: "32px",
            color: "#884B2C",
          }}
        >
          Product Details
        </h1>
        {/* MAIN CARD */}
        <div className=" grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* IMAGES */}
          <div className="flex flex-col gap-4">
            <div className="flex h-80 items-center justify-center overflow-hidden rounded-lg border bg-white">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={product.name || "Product"}
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-sm text-gray-400">No product image</span>
              )}
            </div>

            {images.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    aria-label={`Show product image ${index + 1}`}
                    aria-pressed={activeImageIndex === index}
                    className={`h-20 w-20 overflow-hidden rounded border bg-white ${
                      activeImageIndex === index
                        ? "border-[#884B2C] ring-1 ring-[#884B2C]"
                        : "border-gray-300 hover:border-[#884B2C]"
                    }`}
                  >
                    <img
                      src={image}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* INFO */}
          <div className="flex flex-col gap-4">
            {/* NAME */}
            <h2 className="text-2xl font-bold text-[#884B2C]">
              {product.name}
            </h2>

            {/* PRICE */}
            <div className="flex items-center gap-3">
              {product.status === "Promo" ? (
                <>
                  <p className="text-gray-400 line-through text-lg">
                    {product.price} TND
                  </p>

                  <p className="text-xl font-bold text-[#A2664E]">
                    {product.promoPrice} TND
                  </p>
                </>
              ) : (
                <p className="text-xl font-bold text-[#A2664E]">
                  {product.price} TND
                </p>
              )}
            </div>

            {/* STATUS BADGE */}
            <div>
              {product.status === "Promo" && (
                <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs">
                  PROMO
                </span>
              )}

              {product.status === "Available" && (
                <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs">
                  AVAILABLE
                </span>
              )}

              {product.status === "Out of Stock" && (
                <span className="bg-red-200 text-red-600 px-3 py-1 rounded-full text-xs">
                  OUT OF STOCK
                </span>
              )}
            </div>

            {/* DETAILS */}
            <div className="text-sm text-gray-700 space-y-2">
              <p>
                <strong>Category:</strong> {product.category?.name || "N/A"}
              </p>
              <p>
                <strong>Collection:</strong> {product.collection?.name || "N/A"}
              </p>
              <p>
                <strong>Size:</strong> {product.size}
              </p>
              <p>
                <strong>Quantity:</strong> {product.quantityInStock}
              </p>
            </div>

            {/* DESCRIPTION */}
            <p className="text-gray-600 leading-relaxed">
              {product.description}
            </p>

            {/* BUTTONS */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => HandelEditProduct()}
                className="px-4 py-2 bg-[#A2664E] text-white rounded-md hover:opacity-90"
              >
                Edit
              </button>

              <button
                onClick={() => onClose()}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {editProduct && (
        <CreateProduct
          onClose={() => setEditProduct(false)}
          onSaved={() => setEditProduct(false)}
          product={product}
        />
      )}
    </div>
  );
}

export default ViewProduct;
