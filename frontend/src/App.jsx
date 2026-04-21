import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import Layout from "./layout/Layout";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Vehicles from "./pages/Vehicles";
import Services from "./pages/Services";
import Employees from "./pages/Employees";
import Parts from "./pages/Parts";
import Invoices from "./pages/Invoices";
import VehicleHistory from "./pages/VehicleHistory";
import PrintInvoice from "./pages/PrintInvoice";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import Problems from "./pages/Problems";
import EmployeePerformance from "./pages/EmployeePerformance";

import "./styles/dashboard.css";

function App() {
  // 🚀 FIX: lazy load user first (IMPORTANT)
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (!token || !savedUser) return null;

      return JSON.parse(savedUser);
    } catch (err) {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN */}
        <Route
          path="/login"
          element={
            user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
          }
        />

        {/* REGISTER */}
        <Route
          path="/register"
          element={
            <ProtectedRoute user={user} requiredRole="admin">
              <Register />
            </ProtectedRoute>
          }
        />

        {/* MAIN APP */}
        <Route
          path="/"
          element={
            <ProtectedRoute user={user}>
              <Layout user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="services" element={<Services />} />
          <Route path="problems" element={<Problems />} />
          <Route path="employees" element={<Employees />} />
          <Route path="reports" element={<Reports />} />
          <Route path="employee-performance" element={<EmployeePerformance />} />
          <Route path="parts" element={<Parts />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/:invoiceId/print" element={<PrintInvoice />} />
          <Route path="vehicles/:vehicleId/history" element={<VehicleHistory />} />
        </Route>

        {/* fallback */}
        <Route
          path="*"
          element={<Navigate to={user ? "/" : "/login"} replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;