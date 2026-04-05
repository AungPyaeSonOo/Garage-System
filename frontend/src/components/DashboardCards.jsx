// components/DashboardCards.jsx
function DashboardCards({ stats }) {
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon">👥</div>
        <div className="stat-info">
          <h3>Total Customers</h3>
          <p>{stats.totalCustomers}</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">🚗</div>
        <div className="stat-info">
          <h3>Total Vehicles</h3>
          <p>{stats.totalVehicles}</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">🔧</div>
        <div className="stat-info">
          <h3>Active Services</h3>
          <p>{stats.activeServices}</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">👨‍🔧</div>
        <div className="stat-info">
          <h3>Employees</h3>
          <p>{stats.totalEmployees}</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">💰</div>
        <div className="stat-info">
          <h3>Total Revenue</h3>
          <p>{stats.totalRevenue?.toLocaleString()} Ks</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">⏳</div>
        <div className="stat-info">
          <h3>Pending Invoices</h3>
          <p>{stats.pendingInvoices}</p>
        </div>
      </div>
    </div>
  );
}

export default DashboardCards;