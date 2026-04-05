// layout/Layout.jsx
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "../styles/sidebar.css";
import "../styles/dashboard.css";
import { useState, useEffect } from "react";

function Layout({ user, onLogout }) {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check if current route is dashboard
  const isDashboard = location.pathname === '/';

  return (
    <div className="dashboard-container">
      <Sidebar user={user} onLogout={onLogout} />
      <div className={`main-section ${isMobile ? 'mobile-view' : ''}`}>
        {/* Only show Header on dashboard */}
        {!isMobile && isDashboard && <Header user={user} />}
        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Layout;