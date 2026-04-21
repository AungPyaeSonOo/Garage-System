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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Load auth on start
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      setUser(null);
    }

    setLoading(false);
  }, []);

  // ✅ Sync between tabs / refresh safety
  useEffect(() => {
    const syncAuth = () => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (!token || !savedUser) {
        setUser(null);
      } else {
        setUser(JSON.parse(savedUser));
      }
    };

    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  const handleLogin = (userData) => setUser(userData);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login onLogin={handleLogin} />} />

        {/* Register (admin only) */}
        <Route
          path="/register"
          element={
            <ProtectedRoute user={user} requiredRole="admin">
              <Register />
            </ProtectedRoute>
          }
        />

        {/* Protected Layout */}
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
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;