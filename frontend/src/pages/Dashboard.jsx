// pages/Dashboard.jsx
import { useEffect, useState } from "react";
import api from "../utils/api";
import DashboardCards from "../components/DashboardCards";
import DashboardCharts from "../components/DashboardCharts";

function Dashboard() {
  const [dateRange, setDateRange] = useState("week");
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalVehicles: 0,
    activeServices: 0,
    totalEmployees: 0,
    totalRevenue: 0,
    pendingInvoices: 0
  });
  
  const [chartData, setChartData] = useState({
    revenueData: [],
    serviceStatusData: [],
    topCustomersData: [],
    popularServicesData: [],
    recentActivities: [],
    lowStockItems: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const getDateRange = () => {
    const now = new Date();
    let start = new Date();
    
    if (dateRange === "day") {
      start.setDate(now.getDate() - 1);
    } else if (dateRange === "week") {
      start.setDate(now.getDate() - 7);
    } else if (dateRange === "month") {
      start.setMonth(now.getMonth() - 1);
    }
    
    return {
      start: start.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    };
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const range = getDateRange();
      const response = await api.get(`/dashboard?start=${range.start}&end=${range.end}`);
      const data = response.data;
      
      setStats(data.stats);
      setChartData({
        revenueData: data.revenueData,
        serviceStatusData: data.serviceStatusData,
        topCustomersData: data.topCustomersData,
        popularServicesData: data.popularServicesData,
        recentActivities: data.recentActivities,
        lowStockItems: data.lowStockItems
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return "0 Ks";
    return new Intl.NumberFormat("en-US").format(price) + " Ks";
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={loadDashboardData}>Try Again</button>
      </div>
    );
  }

  return (
    <>
      <div className="dashboard-header">
        <h2>📊 Dashboard</h2>
        <div className="date-range-selector">
          <button 
            className={`range-btn ${dateRange === 'day' ? 'active' : ''}`}
            onClick={() => setDateRange('day')}
          >
            Today
          </button>
          <button 
            className={`range-btn ${dateRange === 'week' ? 'active' : ''}`}
            onClick={() => setDateRange('week')}
          >
            This Week
          </button>
          <button 
            className={`range-btn ${dateRange === 'month' ? 'active' : ''}`}
            onClick={() => setDateRange('month')}
          >
            This Month
          </button>
        </div>
      </div>

      <DashboardCards stats={stats} />
      
      <DashboardCharts 
        chartData={chartData}
        loading={loading}
        error={error}
        onRetry={loadDashboardData}
        formatPrice={formatPrice}
      />
    </>
  );
}

export default Dashboard;