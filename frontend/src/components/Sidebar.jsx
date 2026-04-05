import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import AvatarManager from "../components/AvatarManager";
import "../styles/sidebar.css";

function Sidebar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setWindowWidth(window.innerWidth);
      if (window.innerWidth > 768) setIsOpen(true); else setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isActive = (path) => location.pathname === path ? "active" : "";
  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => { if (isMobile) setIsOpen(false); };
  const handleLogoutClick = () => { onLogout(); navigate("/login"); };
  const getLogoText = () => {
    if (windowWidth <= 320) return "MSW";
    if (windowWidth <= 360) return "MSW & Bros";
    return "MSW & Brothers";
  };

  return (
    <>
      {isMobile && (
        <div className="mobile-header">
          <button className={`hamburger-btn ${isOpen ? "active" : ""}`} onClick={toggleSidebar}>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
          <h2 className="mobile-logo">{getLogoText()}</h2>
          <div className="right-space"></div>
        </div>
      )}
      {isMobile && isOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

      <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <h2 className="logo">MSW & Brothers</h2>
          {isMobile && <button className="close-btn" onClick={closeSidebar}>✕</button>}
        </div>
        <div className="user-info" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px" }}>
          <AvatarManager user={user} size={40} />
          <div className="user-details">
            <div className="user-name" style={{ fontSize: "13px", marginBottom: "2px", fontWeight: "600", color: "white" }}>
              {user?.full_name || user?.username || "User"}
            </div>
            <div className="user-role" style={{ fontSize: "11px", color: user?.role === "admin" ? "#facc15" : "#94a3b8" }}>
              {user?.role === "admin" ? "Administrator" : "Staff"}
            </div>
          </div>
        </div>
        <ul className="menu">
          <li><Link to="/" className={isActive("/")} onClick={closeSidebar}><span className="menu-icon">📊</span><span className="menu-text">Dashboard</span></Link></li>
          {/* All menu items are now visible to both admin and staff */}
          <li><Link to="/customers" className={isActive("/customers")} onClick={closeSidebar}><span className="menu-icon">👥</span><span className="menu-text">Customers</span></Link></li>
          <li><Link to="/vehicles" className={isActive("/vehicles")} onClick={closeSidebar}><span className="menu-icon">🚗</span><span className="menu-text">Vehicles</span></Link></li>
          <li><Link to="/services" className={isActive("/services")} onClick={closeSidebar}><span className="menu-icon">🔧</span><span className="menu-text">Services</span></Link></li>
          <li><Link to="/employees" className={isActive("/employees")} onClick={closeSidebar}><span className="menu-icon">👨‍🔧</span><span className="menu-text">Employees</span></Link></li>
          <li><Link to="/parts" className={isActive("/parts")} onClick={closeSidebar}><span className="menu-icon">📦</span><span className="menu-text">Parts</span></Link></li>
          <li><Link to="/invoices" className={isActive("/invoices")} onClick={closeSidebar}><span className="menu-icon">💰</span><span className="menu-text">Invoices</span></Link></li>
          <li><Link to="/reports" className={isActive("/reports")} onClick={closeSidebar}><span className="menu-icon">📊</span><span className="menu-text">Reports</span></Link></li>
        </ul>
        <div className="sidebar-footer">    
          <div className="footer-item" onClick={handleLogoutClick}>
            <span>🚪</span><span>Logout</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;