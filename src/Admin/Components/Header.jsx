import React, { useState, useRef, useEffect, useMemo } from "react";
import { FaSearch, FaCog, FaSignOutAlt, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import user from "../pics/user.jpg";

const normalizeSearchValue = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

function Header({ setIsConnected, adminName }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchData, setSearchData] = useState({ products: [], collections: [], orders: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchLoaded, setSearchLoaded] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isSearchOpen || searchLoaded) return undefined;

    let isCurrent = true;
    setSearchLoading(true);
    setSearchError(false);

    Promise.allSettled([
      axiosInstance.get("/products/"),
      axiosInstance.get("/collections/"),
      axiosInstance.get("/orders/"),
    ])
      .then((responses) => {
        if (!isCurrent) return;
        const [products, collections, orders] = responses;
        const nextData = {
          products: products.status === "fulfilled" && Array.isArray(products.value.data) ? products.value.data : [],
          collections: collections.status === "fulfilled" && Array.isArray(collections.value.data) ? collections.value.data : [],
          orders: orders.status === "fulfilled" && Array.isArray(orders.value.data) ? orders.value.data : [],
        };
        setSearchData(nextData);
        setSearchError(responses.every((response) => response.status === "rejected"));
      })
      .finally(() => {
        if (isCurrent) {
          setSearchLoading(false);
          setSearchLoaded(true);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [isSearchOpen, searchLoaded]);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      await axiosInstance.post("/auth/logout", { refreshToken }).catch(() => null);
    }
    setIsConnected(false);
    localStorage.removeItem("isConnected");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("adminName");
    localStorage.removeItem("adminRole");
    navigate("/login");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setIsSearchOpen(true);
  };

  const searchResults = useMemo(() => {
    const query = normalizeSearchValue(searchQuery.trim());
    if (query.length < 2) return [];

    const products = searchData.products
      .filter((product) =>
        normalizeSearchValue([
          product.name,
          product.description,
          product.category?.name,
          product.collection?.name,
          product.status,
        ].join(" ")).includes(query),
      )
      .slice(0, 4)
      .map((product) => ({
        type: "product",
        id: product._id,
        title: product.name,
        subtitle: [product.category?.name, product.collection?.name].filter(Boolean).join(" · ") || "Produit",
      }));

    const collections = searchData.collections
      .filter((collection) =>
        normalizeSearchValue(`${collection.name} ${collection.description}`).includes(query),
      )
      .slice(0, 3)
      .map((collection) => ({
        type: "collection",
        id: collection._id,
        title: collection.name,
        subtitle: `${collection.products?.length || 0} produit${collection.products?.length === 1 ? "" : "s"}`,
      }));

    const orders = searchData.orders
      .filter((order) => {
        const productNames = (order.items || []).map((item) => item.product?.name || "").join(" ");
        return normalizeSearchValue([
          order._id,
          order.customerName,
          order.customerEmail,
          order.status,
          productNames,
        ].join(" ")).includes(query);
      })
      .slice(0, 4)
      .map((order) => ({
        type: "order",
        id: order._id,
        title: `Commande #${String(order._id).slice(-7).toUpperCase()}`,
        subtitle: `${order.customerName || "Client"} · ${order.status || "pending"}`,
      }));

    return [...products, ...collections, ...orders];
  }, [searchData, searchQuery]);

  const handleSearchResult = (result) => {
    setIsSearchOpen(false);
    setSearchQuery("");

    if (result.type === "product") {
      navigate("/categories", { state: { searchProductId: result.id } });
    } else if (result.type === "collection") {
      navigate(`/view-collection/${result.id}`);
    } else {
      navigate("/orders", { state: { searchOrderId: result.id } });
    }
  };

  const displayName = adminName || localStorage.getItem("adminName") || "Admin";

  return (
    <header className="flex items-center justify-between p-4 bg-white shadow-md">
      {/* Search bar */}
      <div className="relative min-w-0 flex-1 px-3 sm:px-6" ref={searchRef}>
        <form onSubmit={handleSearch} className="w-full max-w-md">
          <div className="relative">
          <input
            type="text"
            placeholder="Search products, collections, orders..."
            aria-label="Search products, collections, and orders"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isSearchOpen}
            aria-controls="dashboard-search-results"
            value={searchQuery}
            onFocus={() => setIsSearchOpen(true)}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setIsSearchOpen(false);
            }}
            className="w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-10 pr-10 text-sm shadow-sm transition focus:border-[#A2664E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#884B2C]/20"
          />
            <FaSearch className="absolute left-3 top-3 text-gray-500" aria-hidden="true" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700"
              >
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </form>

        {isSearchOpen && (
          <div id="dashboard-search-results" className="absolute left-0 right-0 top-full z-40 mt-2 max-h-[min(70vh,520px)] overflow-y-auto rounded-md border border-gray-200 bg-white py-2 shadow-xl sm:right-auto sm:w-[min(420px,calc(100vw-340px))]">
            {searchLoading ? (
              <p className="px-4 py-5 text-sm text-gray-500">Loading dashboard data...</p>
            ) : searchError ? (
              <div className="px-4 py-4 text-sm text-gray-600">
                <p>Search data could not be loaded.</p>
                <button type="button" onClick={() => setSearchLoaded(false)} className="mt-2 font-semibold text-[#884B2C] underline underline-offset-2">
                  Retry
                </button>
              </div>
            ) : searchQuery.trim().length < 2 ? (
              <p className="px-4 py-5 text-sm text-gray-500">Type at least 2 characters to search.</p>
            ) : searchResults.length === 0 ? (
              <p className="px-4 py-5 text-sm text-gray-500">No matching products, collections, or orders.</p>
            ) : (
              ["product", "collection", "order"].map((type) => {
                const group = searchResults.filter((result) => result.type === type);
                if (group.length === 0) return null;
                const groupLabel = { product: "Products", collection: "Collections", order: "Orders" }[type];
                return (
                  <section key={type}>
                    <h2 className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">{groupLabel}</h2>
                    {group.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        type="button"
                        onClick={() => handleSearchResult(result)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-[#faf7f2] focus:bg-[#faf7f2] focus:outline-none"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-gray-800">{result.title}</span>
                          <span className="mt-0.5 block truncate text-xs text-gray-500">{result.subtitle}</span>
                        </span>
                        <span className="shrink-0 text-xs text-[#A2664E]">Open</span>
                      </button>
                    ))}
                  </section>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* User avatar + dropdown */}
      <div className="relative" ref={dropdownRef}>
        <img
          src={user}
          alt="User avatar"
          className="w-12 h-12 rounded-full cursor-pointer border border-gray-300 hover:ring-2 hover:ring-[#884B2C] transition"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
        />

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-4">
              <p className="text-black italic font-bold px-2 py-1 bg-[#F4E5C8] rounded truncate">
                {displayName}
              </p>
              <hr className="my-2" />
              <button
                className="flex items-center w-full font-semibold text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition"
                onClick={() => navigate("/settings")}
              >
                <FaCog className="mr-2" />
                Settings
              </button>
              <button
                className="flex items-center w-full font-semibold text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded transition"
                onClick={handleLogout}
              >
                <FaSignOutAlt className="mr-2" />
                Log out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
