import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import CreateCategory from "../Components/CreateCategory.jsx";
import CreateProduct from "../Components/FormProduct.jsx";
import ViewProduct from "../Components/ViewProduct.jsx";
import { Eye, SquarePen, Trash2 } from "lucide-react";
import ConfirmAlert from "../Components/ConfirmAlert.jsx";

const PRODUCTS_PER_PAGE = 6;

function CategoriesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState("");

  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showProduct, setShowProduct] = useState(false);
  const [editProduct, setEditProduct] = useState(false);
  const [alertDelete, setAlertDelete] = useState(false);
  const [ProductToDelete, setProductToDelete] = useState(null);

  const fetchProducts = useCallback(async ({ showLoader = true } = {}) => {
    if (showLoader) setLoading(true);
    setError("");

    try {
      const response = await axiosInstance.get("/products/");
      setProducts(response.data);
    } catch (err) {
      setError("Failed to fetch products.");
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    setError("");
    try {
      const response = await axiosInstance.get("/categories/");
      setCategories(response.data);
    } catch (err) {
      setError("Failed to fetch categories.");
    }
  }, []);

  const productView = (p) => {
    setProduct(p);
    setShowProduct(true);
  };

  const productEdit = (p) => {
    setProduct(p);
    setEditProduct(true);
  };

  const productToDelete = (product) => {
    setProductToDelete(product);
    setAlertDelete(true);
  };

  const productDelete = async (product) => {
    setDeleteLoading(true);
    setError("");

    try {
      await axiosInstance.delete(`/products/${product._id}`);
      await fetchProducts({ showLoader: false });
      setAlertDelete(false);
      setProductToDelete(null);
    } catch (err) {
      setError("Failed to delete product.");
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  useEffect(() => {
    const searchProductId = location.state?.searchProductId;
    if (!searchProductId || products.length === 0) return;

    const matchingProduct = products.find((item) => item._id === searchProductId);
    if (!matchingProduct) return;

    setProduct(matchingProduct);
    setShowProduct(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate, products]);

  const categoriesList = useMemo(() => {
    // If we have fetched categories from backend, use them
    if (categories.length > 0) {
      return ["All", ...categories.map(cat => cat.name)];
    }
    // Fallback to deriving categories from products (while loading or if fetch failed)
    const categoriesFromProducts = products
      .map((product) => product.category?.name || product.category)
      .filter(Boolean);
    return ["All", ...new Set(categoriesFromProducts)];
  }, [products, categories]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "All") return products;

    return products.filter((product) => product.category?.name === selectedCategory);
  }, [products, selectedCategory]);
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const pageStart = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const visibleProducts = filteredProducts.slice(pageStart, pageStart + PRODUCTS_PER_PAGE);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, Math.max(1, totalPages)));
  }, [totalPages]);

  const getImageUrl = (product) => {
    // The Product model stores images as an ARRAY of URLs (e.g. ImageKit).
    const image =
      product.images?.[0] || product.pubImage || product.image || product.img;
    if (!image) return "https://via.placeholder.com/64";
    if (image.startsWith("http")) return image;
    // If for some reason the image is not a full URL, fallback to placeholder
    return "https://via.placeholder.com/64";
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1
          style={{
            fontFamily: "'Style Script', cursive",
            fontSize: "32px",
            color: "#884B2C",
          }}
        >
          Categories & Products
        </h1>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowCreateCategory(true)}
            className="px-4 py-2 bg-[#A2664E] text-white rounded-md hover:opacity-90"
          >
            + Add Category
          </button>

          <button
            onClick={() => setShowCreateProduct(true)}
            className="px-4 py-2 bg-[#A2664E] text-white rounded-md hover:opacity-90"
          >
            + Add New Product
          </button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {categoriesList.map((category) => (
          <button
            key={category}
            onClick={() => {
              setSelectedCategory(category);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-md border text-sm ${
              selectedCategory === category
                ? "bg-[#A2664E] text-white border-[#A2664E]"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {category}
          </button>
        ))}
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
              <th className="px-4 py-3 text-left">Image</th>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Price</th>
              <th className="px-4 py-3 text-left">Price Promo</th>
              <th className="px-4 py-3 text-left">Sizes</th>
              <th className="px-4 py-3 text-left">Quantity</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Collection</th>
              <th className="px-4 py-3 text-center">Status</th>
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
                  Loading products...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td
                  colSpan="11"
                  className="px-4 py-6 text-center text-gray-500"
                >
                  No products found.
                </td>
              </tr>
            ) : (
              visibleProducts.map((product, index) => (
                <tr key={product._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {pageStart + index + 1}
                  </td>

                  <td className="px-4 py-3">
                    <img
                      className="h-16 w-16 rounded object-cover"
                      src={getImageUrl(product)}
                      alt={product.name}
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/64";
                      }}
                    />
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-900">
                    {product.name}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="block max-w-sm truncate" title={product.description || ""}>
                      {product.description || "N/A"}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-900">
                    {product.price?.toLocaleString() + " DT" || "N/A"}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-900">
                    {product.promoPrice
                      ? product.promoPrice.toLocaleString() + " DT"
                      : "N/A"}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-900">
                    {product.size || "N/A"}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-900">
                    {product.quantityInStock ?? "N/A"}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-900">
                    {product.category?.name || "N/A"}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-900">
                    {product.collection?.name || "N/A"}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {/* STATUS BADGE */}
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
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => productView(product)}
                        className="p-1 rounded-full hover:bg-blue-100"
                      >
                        <Eye className="h-5 w-5 text-blue-500" />
                      </button>

                      <button
                        onClick={() => productEdit(product)}
                        className="p-1 rounded-full hover:bg-gray-200"
                      >
                        <SquarePen className="h-4 w-4 text-gray-600" />
                      </button>

                      <button
                        onClick={() => productToDelete(product)}
                        className="p-1 rounded-full hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && filteredProducts.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600">
            Showing {pageStart + 1}–{Math.min(pageStart + PRODUCTS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} products
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="min-w-20 text-center text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage >= totalPages}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showCreateCategory && (
        <CreateCategory
          onClose={() => setShowCreateCategory(false)}
          onSuccess={() => {
            setShowCreateCategory(false);
            fetchCategories();
          }}
        />
      )}
      {showCreateProduct && (
        <CreateProduct
          onClose={() => setShowCreateProduct(false)}
          onSaved={fetchProducts}
        />
      )}

      {editProduct && (
        <CreateProduct
          onClose={() => setEditProduct(false)}
          onSaved={fetchProducts}
          product={product}
        />
      )}

      {showProduct && (
        <ViewProduct product={product} onClose={() => setShowProduct(false)} />
      )}

      {alertDelete && (
        <ConfirmAlert
          title="Delete Product?"
          message={`This will permanently remove “${ProductToDelete?.name || "unknown"}” from your list.`}
          onConfirm={() => productDelete(ProductToDelete)}
          onCancel={() => setAlertDelete(false)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}

export default CategoriesPage;