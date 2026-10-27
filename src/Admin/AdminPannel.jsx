import React, { useState } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./Components/Sidebar";
import Header from "./Components/Header";

import HomePage from "../Admin/Pages/HomePage";
import LoginPage from "../Admin/Pages/LoginPage";

import OrdersPage from "./Pages/OrdersPage";
import CustomersPage from "./Pages/CustomersPage";
import CollectionsPage from "./Pages/CollectionsPage";
import CategoriesPage from "./Pages/CategoriesPage";

import UserDetailPage from "./Pages/UserDetailPage";
import ShippingSettingsPage from "./Pages/ShippingSettingsPage";


import ViewCollection from "./Pages/view-collection";
import EditCollection from "./Pages/edit-collection";

function ProtectedRoute({ isConnected, adminRole, requiredRole, children }) {
  if (!isConnected) return <Navigate to="/login" replace />;
  if (requiredRole && adminRole !== requiredRole) return <Navigate to="/home" replace />;
  return children;
}

function AdminPannel() {
  const [isConnected, setIsConnected] = useState(
    localStorage.getItem("isConnected") === "true"
  );
  const [adminName, setAdminName] = useState(
    localStorage.getItem("adminName") || ""
  );
  const [adminRole, setAdminRole] = useState(
    localStorage.getItem("adminRole") || "admin"
  );
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  React.useEffect(() => {
    localStorage.setItem("isConnected", isConnected);
  }, [isConnected]);

  return (
    <div className="flex">
      {!isLoginPage && isConnected && <Sidebar adminRole={adminRole} />}
      <div className="flex-grow">
        {!isLoginPage && isConnected && (
          <Header setIsConnected={setIsConnected} adminName={adminName} />
        )}
        <Routes>
          {/* Default route: redirect based on auth state */}
          <Route
            path="/"
            element={<Navigate to={isConnected ? "/home" : "/login"} replace />}
          />

          {/* Public route */}
          <Route
            path="/login"
            element={
              isConnected ? (
                <Navigate to="/home" replace />
              ) : (
                <LoginPage
                  setIsConnected={setIsConnected}
                  setAdminName={setAdminName}
                  setAdminRole={setAdminRole}
                />
              )
            }
          />

          {/* Protected routes */}
          <Route
            path="/home"
            element={
              <ProtectedRoute isConnected={isConnected}>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute isConnected={isConnected}>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute
                isConnected={isConnected}
                adminRole={adminRole}
                requiredRole="superadmin"
              >
                <CustomersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/:userId"
            element={
              <ProtectedRoute isConnected={isConnected}>
                <UserDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/collections"
            element={
              <ProtectedRoute isConnected={isConnected}>
                <CollectionsPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/categories"
            element={<CategoriesPage />}
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute isConnected={isConnected}>
                <ShippingSettingsPage />
              </ProtectedRoute>
            }
          />
         
          <Route 
          path="/view-collection/:id" 
          element={<ViewCollection/>} />

          <Route
           path="/edit-collection/:id" 
           element={<EditCollection/>} />
        

      </Routes>
      </div>
    </div>
  );
}

export default AdminPannel;
