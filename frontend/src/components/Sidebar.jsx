import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import AvatarManager from "../components/AvatarManager";
import "../styles/sidebar.css";

function Sidebar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isOpen, setIsOpen] = useState(window.innerWidth > 768);

  // =========================
  // HANDLE RESIZE
  // =========================
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      // Desktop always open
      if (!mobile) setIsOpen(true);
      else setIsOpen(false);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // =========================
  // HELPERS
  // =========================
  const isActive = (path) =>
    location.pathname === path ? "active" : "";

  const toggleSidebar = () => setIsOpen(!isOpen);

  const closeSidebar = () => {
    if (isMobile) setIsOpen(false);
  };

  const handleLogoutClick = () => {
    onLogout();
    navigate("/login");
  };

  const getLogoText = () => {
    if (window.innerWidth <= 320) return "MSW";
    if (window.innerWidth <= 360) return "MSW & Bros";
    return "MSW & Brothers";
  };

  // =========================
  // RENDER
  // =========================
  return (
    <>
      {/* MOBILE HEADER */}
      {isMobile && (
        <div className="mobile-header">
          <button
            className={`hamburger-btn ${isOpen ? "active" : ""}`}
            onClick={toggleSidebar}
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>

          <h2 className="mobile-logo">{getLogoText()}</h2>

          <div className="right-space"></div>
        </div>
      )}

      {/* OVERLAY */}
      {isMobile && isOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
      )}

      {/* SIDEBAR */}
      <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
        {/* HEADER */}
        <div className="sidebar-header">
          <h2 className="logo">MSW & Brothers</h2>

          {isMobile && (
            <button className="close-btn" onClick={closeSidebar}>
              ✕
            </button>
          )}
        </div>

        {/* USER */}
        <div className="user-info">
          <AvatarManager user={user} size={40} />

          <div className="user-details">
            <div className="user-name">
              {user?.full_name || user?.username || "User"}
            </div>

            <div
              className="user-role"
              style={{
                color:
                  user?.role === "admin"
                    ? "#facc15"
                    : "#94a3b8"
              }}
            >
              {user?.role === "admin"
                ? "Administrator"
                : "Staff"}
            </div>
          </div>
        </div>

        {/* MENU */}
        <ul className="menu">
          <li>
            <Link to="/" className={isActive("/")} onClick={closeSidebar}>
              <span className="menu-icon">📊</span>
              <span className="menu-text">Dashboard</span>
            </Link>
          </li>

          <li>
            <Link to="/customers" className={isActive("/customers")} onClick={closeSidebar}>
              <span className="menu-icon">👥</span>
              <span className="menu-text">Customers</span>
            </Link>
          </li>

          <li>
            <Link to="/vehicles" className={isActive("/vehicles")} onClick={closeSidebar}>
              <span className="menu-icon">🚗</span>
              <span className="menu-text">Vehicles</span>
            </Link>
          </li>

          <li>
            <Link to="/services" className={isActive("/services")} onClick={closeSidebar}>
              <span className="menu-icon">🔧</span>
              <span className="menu-text">Services</span>
            </Link>
          </li>

          <li>
            <Link to="/employees" className={isActive("/employees")} onClick={closeSidebar}>
              <span className="menu-icon">👨‍🔧</span>
              <span className="menu-text">Employees</span>
            </Link>
          </li>

          <li>
            <Link to="/parts" className={isActive("/parts")} onClick={closeSidebar}>
              <span className="menu-icon">📦</span>
              <span className="menu-text">Parts</span>
            </Link>
          </li>

          <li>
            <Link to="/invoices" className={isActive("/invoices")} onClick={closeSidebar}>
              <span className="menu-icon">💰</span>
              <span className="menu-text">Invoices</span>
            </Link>
          </li>

          <li>
            <Link to="/reports" className={isActive("/reports")} onClick={closeSidebar}>
              <span className="menu-icon">📊</span>
              <span className="menu-text">Reports</span>
            </Link>
          </li>
        </ul>

        {/* FOOTER */}
        <div className="sidebar-footer">
          <div className="footer-item" onClick={handleLogoutClick}>
            <span>🚪</span>
            <span>Logout</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;