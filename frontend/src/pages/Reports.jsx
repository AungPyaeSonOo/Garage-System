// pages/Reports.jsx
import { useEffect, useState } from "react";
import api from "../utils/api"; // Change from axios to api
import "../styles/reports.css";

function Reports() {
  const [dateRange, setDateRange] = useState("month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Report data with default values
  const [revenueData, setRevenueData] = useState({
    total: 0,
    paid: 0,
    unpaid: 0,
    byMethod: { cash: 0, card: 0, bank: 0 }
  });
  
  const [serviceStats, setServiceStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    popularServices: []
  });
  
  const [customerStats, setCustomerStats] = useState({
    total: 0,
    active: 0,
    topCustomers: []
  });
  
  const [partsStats, setPartsStats] = useState({
    totalParts: 0,
    totalValue: 0,
    lowStock: [],
    popularParts: []
  });
  
  const [employeeStats, setEmployeeStats] = useState({
    total: 0,
    active: 0,
    topPerformers: []
  });

  useEffect(() => {
    loadReportData();
  }, [dateRange, customStartDate, customEndDate]);

  const getDateRange = () => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (dateRange === "day") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (dateRange === "week") {
      start.setDate(now.getDate() - 7);
    } else if (dateRange === "month") {
      start.setMonth(now.getMonth() - 1);
    } else if (dateRange === "year") {
      start.setFullYear(now.getFullYear() - 1);
    } else if (dateRange === "custom") {
      return { start: customStartDate, end: customEndDate };
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const loadReportData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const range = getDateRange();
      
      // Load all data in parallel with error handling
      const [
        invoicesRes,
        servicesRes,
        customersRes,
        partsRes,
        employeesRes
      ] = await Promise.allSettled([
        api.get("/invoices").catch(() => ({ status: 'rejected', value: { data: [] } })),
        api.get("/services").catch(() => ({ status: 'rejected', value: { data: [] } })),
        api.get("/customers").catch(() => ({ status: 'rejected', value: { data: [] } })),
        api.get("/parts").catch(() => ({ status: 'rejected', value: { data: [] } })),
        api.get("/employees").catch(() => ({ status: 'rejected', value: { data: [] } }))
      ]);

      // Process invoice data for revenue - FIXED NaN issue
      if (invoicesRes.status === 'fulfilled' && invoicesRes.value?.data) {
        const invoices = invoicesRes.value.data || [];
        const filteredInvoices = filterByDate(invoices, range);
        
        // Calculate totals with fallback to 0
        const total = filteredInvoices.reduce((sum, inv) => {
          const cost = parseFloat(inv.total_cost) || 0;
          return sum + cost;
        }, 0);
        
        const paid = filteredInvoices.reduce((sum, inv) => {
          const amount = parseFloat(inv.paid_amount) || 0;
          return sum + amount;
        }, 0);
        
        // Calculate by payment method
        const byMethod = { cash: 0, card: 0, bank: 0 };
        filteredInvoices.forEach(inv => {
          const method = inv.payment_method || 'cash';
          const amount = parseFloat(inv.paid_amount) || 0;
          if (byMethod[method] !== undefined) {
            byMethod[method] += amount;
          } else {
            byMethod.cash += amount; // Default to cash if unknown method
          }
        });

        setRevenueData({
          total,
          paid,
          unpaid: total - paid,
          byMethod
        });
      } else {
        // Set default values if no data
        setRevenueData({
          total: 0,
          paid: 0,
          unpaid: 0,
          byMethod: { cash: 0, card: 0, bank: 0 }
        });
      }

      // Process service data
      if (servicesRes.status === 'fulfilled' && servicesRes.value?.data) {
        const services = servicesRes.value.data || [];
        const filteredServices = filterByDate(services, range, 'check_in_date');
        
        const completed = filteredServices.filter(s => s.status === 'completed').length;
        const inProgress = filteredServices.filter(s => s.status === 'in_progress').length;
        const pending = filteredServices.filter(s => s.status === 'pending').length;

        // Get popular services
        const serviceCount = {};
        filteredServices.forEach(s => {
          const desc = s.problem_description?.substring(0, 30) || 'Unknown Service';
          serviceCount[desc] = (serviceCount[desc] || 0) + 1;
        });

        const popularServices = Object.entries(serviceCount)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setServiceStats({
          total: filteredServices.length,
          completed,
          inProgress,
          pending,
          popularServices
        });
      }

      // Process customer data
      if (customersRes.status === 'fulfilled' && customersRes.value?.data) {
        const customers = customersRes.value.data || [];
        
        // Simple top customers (you can enhance this with actual invoice data)
        const topCustomers = customers.slice(0, 5).map(c => ({
          name: c.name || 'Unknown',
          total: 0 // You'll need to calculate from invoices
        }));

        setCustomerStats({
          total: customers.length,
          active: customers.length,
          topCustomers
        });
      }

      // Process parts data
      if (partsRes.status === 'fulfilled' && partsRes.value?.data) {
        const parts = partsRes.value.data || [];
        
        const totalValue = parts.reduce((sum, p) => {
          const price = parseFloat(p.buy_price) || 0;
          const stock = parseInt(p.stock) || 0;
          return sum + (price * stock);
        }, 0);
        
        const lowStock = parts.filter(p => (parseInt(p.stock) || 0) < 10).map(p => ({
          name: p.part_name || 'Unknown',
          stock: parseInt(p.stock) || 0,
          brand: p.brand || 'N/A'
        }));

        setPartsStats({
          totalParts: parts.length,
          totalValue,
          lowStock,
          popularParts: []
        });
      }

      // Process employee data
      if (employeesRes.status === 'fulfilled' && employeesRes.value?.data) {
        const employees = employeesRes.value.data || [];
        
        setEmployeeStats({
          total: employees.length,
          active: employees.filter(e => e.status === 'active').length,
          topPerformers: []
        });
      }

    } catch (error) {
      console.error("Error loading reports:", error);
      setError("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const filterByDate = (data, range, dateField = 'date') => {
    if (!data || !Array.isArray(data)) return [];
    if (!range.start || !range.end) return data;
    
    const start = new Date(range.start);
    const end = new Date(range.end);
    
    return data.filter(item => {
      if (!item[dateField]) return false;
      const itemDate = new Date(item[dateField]);
      return itemDate >= start && itemDate <= end;
    });
  };

  const formatPrice = (price) => {
    // FIX: Handle NaN, undefined, null
    if (price === undefined || price === null || isNaN(price)) {
      return '0 Ks';
    }
    return new Intl.NumberFormat('en-US').format(price) + ' Ks';
  };

  const formatPercentage = (value, total) => {
    // FIX: Handle division by zero and NaN
    if (!total || total === 0) return '0%';
    if (!value || isNaN(value)) return '0%';
    return ((value / total) * 100).toFixed(1) + '%';
  };

  const exportToCSV = () => {
    const range = getDateRange();
    // Create CSV content with safe values
    const safeRevenue = {
      total: revenueData.total || 0,
      paid: revenueData.paid || 0,
      unpaid: revenueData.unpaid || 0
    };

    const csvContent = [
      ['Report Type', 'Value', 'Date Range'].join(','),
      ['Total Revenue', safeRevenue.total, `${range.start} to ${range.end}`].join(','),
      ['Paid Amount', safeRevenue.paid].join(','),
      ['Unpaid Amount', safeRevenue.unpaid].join(','),
      [],
      ['Services Report'],
      ['Total Services', serviceStats.total || 0].join(','),
      ['Completed', serviceStats.completed || 0].join(','),
      ['In Progress', serviceStats.inProgress || 0].join(','),
      ['Pending', serviceStats.pending || 0].join(','),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${range.start}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={loadReportData}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <div className="header">
        <h2>📊 Reports & Analytics</h2>
        <div className="header-right">
          <div className="date-range-selector">
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="date-select"
            >
              <option value="day">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last 12 Months</option>
              <option value="custom">Custom Range</option>
            </select>
            
            {dateRange === 'custom' && (
              <div className="custom-range">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="date-input"
                />
                <span>to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="date-input"
                />
              </div>
            )}
          </div>
          <button onClick={exportToCSV} className="export-btn">
            ⬇️ Export Report
          </button>
        </div>
      </div>

      {/* Revenue Overview - Now safe from NaN */}
      <div className="report-section">
        <h3>💰 Revenue Overview</h3>
        <div className="stats-grid">
          <div className="stat-card revenue">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <h3>Total Revenue</h3>
              <p className="amount">{formatPrice(revenueData.total)}</p>
            </div>
          </div>
          <div className="stat-card paid">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>Paid Amount</h3>
              <p className="amount">{formatPrice(revenueData.paid)}</p>
              <small>{formatPercentage(revenueData.paid, revenueData.total)}</small>
            </div>
          </div>
          <div className="stat-card unpaid">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <h3>Unpaid Amount</h3>
              <p className="amount">{formatPrice(revenueData.unpaid)}</p>
              <small>{formatPercentage(revenueData.unpaid, revenueData.total)}</small>
            </div>
          </div>
        </div>

        <div className="payment-methods">
          <h4>Payment Methods</h4>
          <div className="method-bars">
            <div className="method-item">
              <span className="method-label">💵 Cash</span>
              <div className="progress-bar">
                <div 
                  className="progress cash" 
                  style={{ width: formatPercentage(revenueData.byMethod.cash, revenueData.paid) }}
                ></div>
              </div>
              <span className="method-value">{formatPrice(revenueData.byMethod.cash)}</span>
            </div>
            <div className="method-item">
              <span className="method-label">💳 Kpay</span>
              <div className="progress-bar">
                <div 
                  className="progress card" 
                  style={{ width: formatPercentage(revenueData.byMethod.card, revenueData.paid) }}
                ></div>
              </div>
              <span className="method-value">{formatPrice(revenueData.byMethod.card)}</span>
            </div>
            
          </div>
        </div>
      </div>

      {/* Services Overview */}
      <div className="report-section">
        <h3>🔧 Services Overview</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-info">
              <h3>Total Services</h3>
              <p>{serviceStats.total}</p>
            </div>
          </div>
          <div className="stat-card success">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>Completed</h3>
              <p>{serviceStats.completed}</p>
              <small>{formatPercentage(serviceStats.completed, serviceStats.total)}</small>
            </div>
          </div>
          <div className="stat-card warning">
            <div className="stat-icon">⚙️</div>
            <div className="stat-info">
              <h3>In Progress</h3>
              <p>{serviceStats.inProgress}</p>
              <small>{formatPercentage(serviceStats.inProgress, serviceStats.total)}</small>
            </div>
          </div>
          <div className="stat-card danger">
            <div className="stat-icon">⏰</div>
            <div className="stat-info">
              <h3>Pending</h3>
              <p>{serviceStats.pending}</p>
              <small>{formatPercentage(serviceStats.pending, serviceStats.total)}</small>
            </div>
          </div>
        </div>
      </div>

      {/* Customers Overview */}
      <div className="report-section">
        <h3>👥 Customers Overview</h3>
        <div className="stats-grid small">
          <div className="stat-card">
            <div className="stat-icon">👤</div>
            <div className="stat-info">
              <h3>Total Customers</h3>
              <p>{customerStats.total}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-info">
              <h3>Active</h3>
              <p>{customerStats.active}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Parts Overview */}
      <div className="report-section">
        <h3>📦 Parts Inventory</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🔧</div>
            <div className="stat-info">
              <h3>Total Parts</h3>
              <p>{partsStats.totalParts}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <h3>Inventory Value</h3>
              <p>{formatPrice(partsStats.totalValue)}</p>
            </div>
          </div>
        </div>

        {partsStats.lowStock.length > 0 && (
          <div className="alert-section">
            <h4>⚠️ Low Stock Alerts</h4>
            <div className="alert-items">
              {partsStats.lowStock.map((part, index) => (
                <div key={index} className="alert-item">
                  <span className="part-name">{part.name}</span>
                  <span className="part-brand">{part.brand}</span>
                  <span className="stock-low">Stock: {part.stock}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Employees Overview */}
      <div className="report-section">
        <h3>👨‍🔧 Employees</h3>
        <div className="stats-grid small">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>Total Employees</h3>
              <p>{employeeStats.total}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>Active</h3>
              <p>{employeeStats.active}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;