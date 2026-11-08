import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import backgroundImage from "../pics/bg.png";
import axiosInstance from "../../api/axiosInstance";

function LoginPage({ setIsConnected, setAdminName, setAdminRole }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axiosInstance.post("/auth/login", {
        email,
        password,
      });

      const data = response.data;
      const token = data.accessToken;
      const refreshToken = data.refreshToken;
      const name = data.admin?.name || data.admin?.email || email;
      const role = data.admin?.role || "admin";

      localStorage.setItem("isConnected", "true");
      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("adminName", name);
      localStorage.setItem("adminRole", role);

      setIsConnected(true);
      if (setAdminName) setAdminName(name);
      if (setAdminRole) setAdminRole(role);
      navigate("/home");
    } catch (err) {
      const message =
        err.response?.data?.message || "Invalid email or password.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center h-screen"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="w-full max-w-md p-8 space-y-8 bg-white/80 backdrop-blur-md rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center text-[#884B2C]">
          Admin Login
        </h2>

        {error && (
          <p className="text-red-500 text-sm text-center bg-red-50 border border-red-200 rounded p-2">
            {error}
          </p>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:ring-[#884B2C] focus:border-[#884B2C] sm:text-sm"
            />
          </div>

          <div className="relative">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:ring-[#884B2C] focus:border-[#884B2C] sm:text-sm pr-10"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEye /> : <FaEyeSlash />}
            </button>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#884B2C] transition-colors disabled:opacity-60"
              style={{ backgroundColor: "#A2664E" }}
              onMouseOver={(e) =>
                !loading && (e.currentTarget.style.backgroundColor = "#884B2C")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#A2664E")
              }
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
