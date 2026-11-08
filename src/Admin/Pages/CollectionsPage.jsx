import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import CreateCollection from "../Components/CreateCollection.jsx";

function CollectionsPage() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchCollections = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axiosInstance.get(`/collections/`);
      setCollections(response.data);
    } catch (err) {
      setError("Failed to fetch collections.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handelAddCollection = () => {
    setShowCreateModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this collection?")) {
      return;
    }

    try {
      await axiosInstance.delete(`/collections/${id}`);
      setCollections((currentCollections) =>
        currentCollections.filter((collection) => collection._id !== id),
      );
    } catch (err) {
      setError("Failed to delete collection.");
    }
  };

  const getImageUrl = (collection) => {
    const image = collection.image || collection.Image || collection.pubImage;
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
          Collections
        </h1>

        <button
          onClick={handelAddCollection}
          className="px-4 py-2 bg-[#A2664E] text-white rounded-md hover:opacity-90"
        >
          + Add Collection
        </button>
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
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-4 py-6 text-center text-gray-500"
                >
                  Loading collections...
                </td>
              </tr>
            ) : collections.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-4 py-6 text-center text-gray-500"
                >
                  No collections found.
                </td>
              </tr>
            ) : (
              collections.map((collection, index) => (
                <tr key={collection._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {index + 1}
                  </td>

                  <td className="px-4 py-3">
                    <img
                      className="h-16 w-16 rounded object-cover"
                      src={getImageUrl(collection)}
                      alt={collection.title}
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/64";
                      }}
                    />
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-900">
                    {collection.title}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-900">
                    {collection.description}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() =>
                          navigate(`/view-collection/${collection._id}`)}
                        className="px-3 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                      >
                        View
                      </button>

                      <button
                        onClick={() =>
                          navigate(`/edit-collection/${collection._id}`)}
                        className="px-3 py-1 text-xs bg-blue-200 rounded hover:bg-blue-300"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(collection._id)}
                        className="px-3 py-1 text-xs bg-red-200 rounded hover:bg-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* MODAL Add Collection */}
      {showCreateModal && (
        <CreateCollection
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchCollections();
          }}
        />
      )}
    </div>
  );
}

export default CollectionsPage;