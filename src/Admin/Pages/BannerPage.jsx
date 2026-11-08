import React, { useEffect, useRef, useState } from "react";
import axiosInstance from "../../api/axiosInstance";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

// Admin page to manage the storefront home banner (images and videos).
function BannerPage() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [link, setLink] = useState("/offer");
  const [progress, setProgress] = useState(null);
  const [deletingId, setDeletingId] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef(null);

  useEffect(() => {
    let active = true;
    axiosInstance
      .get("/settings/banner")
      .then(({ data }) => {
        if (active) setSlides(data.slides || []);
      })
      .catch(() => {
        if (active) setMessage({ type: "error", text: "Failed to load the banner." });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setMessage({ type: "", text: "" });
    if (!selected) {
      setFile(null);
      return;
    }
    const isVideo = selected.type.startsWith("video/");
    if (selected.size > (isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE)) {
      setMessage({
        type: "error",
        text: isVideo ? "Videos must not exceed 50 MB." : "Images must not exceed 5 MB.",
      });
      e.target.value = "";
      setFile(null);
      return;
    }
    setFile(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage({ type: "error", text: "Please choose an image or a video." });
      return;
    }
    const formData = new FormData();
    formData.append("link", link.trim());
    formData.append("media", file);

    setProgress(0);
    setMessage({ type: "", text: "" });
    try {
      const { data } = await axiosInstance.post("/settings/banner", formData, {
        onUploadProgress: ({ loaded, total }) => {
          if (total) setProgress(Math.round((loaded / total) * 100));
        },
      });
      setSlides(data.slides || []);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessage({ type: "success", text: "Slide added to the banner!" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to add the slide.",
      });
    } finally {
      setProgress(null);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    setMessage({ type: "", text: "" });
    try {
      const { data } = await axiosInstance.delete(`/settings/banner/${id}`);
      setSlides(data.slides || []);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to delete the slide.",
      });
    } finally {
      setDeletingId("");
    }
  };

  const uploading = progress !== null;

  return (
    <div className="p-6">
      <h1
        className="mb-6"
        style={{
          fontFamily: "'Style Script', cursive",
          fontSize: "32px",
          color: "#884B2C",
        }}
      >
        Home Banner
      </h1>

      {message.text && (
        <div
          className={`mb-4 rounded-md border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mb-8 max-w-lg rounded-lg border bg-white p-6 shadow-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Image or video
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
              onChange={handleFileChange}
              className="w-full rounded-md border px-4 py-3"
            />
            <p className="mt-1 text-xs text-gray-400">
              Images: JPEG, PNG, WebP or GIF, 5 MB max. Videos: MP4 or WebM, 50 MB max.
            </p>
          </div>

          {previewUrl &&
            (file.type.startsWith("video/") ? (
              <video src={previewUrl} controls muted className="max-h-56 w-full rounded-md bg-black" />
            ) : (
              <img src={previewUrl} alt="Preview" className="max-h-56 w-full rounded-md object-contain" />
            ))}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Link when clicked
            </label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="/offer"
              className="w-full rounded-md border px-4 py-3 outline-none focus:border-[#A2664E]"
            />
            <p className="mt-1 text-xs text-gray-400">
              A page of the shop, for example /offer, /shop or /collections.
            </p>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className={`self-start rounded-md px-6 py-3 text-white transition ${
              uploading ? "bg-gray-400 cursor-not-allowed" : "bg-[#A2664E] hover:opacity-90"
            }`}
          >
            {uploading ? `Uploading... ${progress}%` : "Add to banner"}
          </button>
        </form>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-gray-800">Current slides</h2>
      {loading ? (
        <p className="text-sm text-gray-500">Loading banner...</p>
      ) : slides.length === 0 ? (
        <p className="text-sm text-gray-500">
          No slide yet: the shop shows its default banner.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {slides.map((slide, index) => (
            <div key={slide.id} className="overflow-hidden rounded-lg border bg-white shadow-md">
              {slide.type === "video" ? (
                <video src={slide.url} controls muted preload="metadata" className="h-44 w-full bg-black object-contain" />
              ) : (
                <img src={slide.url} alt={`Slide ${index + 1}`} className="h-44 w-full object-cover" />
              )}
              <div className="flex items-center justify-between gap-3 p-3">
                <p className="min-w-0 truncate text-sm text-gray-600">
                  {index + 1}. {slide.type === "video" ? "Video" : "Image"} → {slide.link}
                </p>
                <button
                  type="button"
                  disabled={deletingId === slide.id}
                  onClick={() => handleDelete(slide.id)}
                  className="shrink-0 rounded-md border border-red-300 px-3 py-1 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingId === slide.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BannerPage;
