import { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#facc15', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];

function DashboardCharts({ chartData, loading, error, onRetry, formatPrice }) {
  // State to control how many items to show initially
  const [activitiesLimit, setActivitiesLimit] = useState(7);
  const [stockLimit, setStockLimit] = useState(7);

  // Format date + time for all activities (e.g., "Mar 29, 14:30")
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Determine which items to display based on limit
  const displayedActivities = chartData.recentActivities.slice(0, activitiesLimit);
  const displayedStock = chartData.lowStockItems.slice(0, stockLimit);

  // Check if there are more items to show
  const hasMoreActivities = chartData.recentActivities.length > activitiesLimit;
  const hasMoreStock = chartData.lowStockItems.length > stockLimit;

  // Handlers to show all items
  const showAllActivities = () => setActivitiesLimit(chartData.recentActivities.length);
  const showAllStock = () => setStockLimit(chartData.lowStockItems.length);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading charts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={onRetry}>Try Again</button>
      </div>
    );
  }

  return (
    <>
      {/* Charts Row 1 */}
      <div className="charts-row">
        {/* Revenue Trend */}
        <div className="chart-card">
          <h3>📈 Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData.revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" tickFormatter={(value) => `${value/1000}k`} />
              <Tooltip 
                formatter={(value) => formatPrice(value)}
                contentStyle={{ background: 'white', border: '1px solid #e2e8f0' }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#facc15" 
                fill="#fef3c7" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Service Status Pie */}
        <div className="chart-card">
          <h3>🔧 Service Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.serviceStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.serviceStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="charts-row">
        {/* Top Customers */}
        <div className="chart-card">
          <h3>🏆 Top Customers</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.topCustomersData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" tickFormatter={(value) => `${value/1000}k`} />
              <Tooltip formatter={(value) => formatPrice(value)} />
              <Bar dataKey="amount" fill="#facc15" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Popular Services */}
        <div className="chart-card">
          <h3>🔥 Popular Services</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.popularServicesData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" stroke="#64748b" />
              <YAxis dataKey="name" type="category" stroke="#64748b" width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="dashboard-bottom">
        {/* Recent Activities */}
        <div className="activities-card">
          <h3>🕐 Recent Activities</h3>
          <div className="activities-list">
            {displayedActivities.length > 0 ? (
              displayedActivities.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-icon">
                    {activity.type === 'service' ? '🔧' : '💰'}
                  </div>
                  <div className="activity-details">
                    <p className="activity-desc">{activity.description}</p>
                    <p className="activity-time">{formatDateTime(activity.time)}</p>
                  </div>
                  {activity.amount && (
                    <span className="activity-amount">{formatPrice(activity.amount)}</span>
                  )}
                  {activity.status && (
                    <span className={`status-badge status-${activity.status}`}>
                      {activity.status === 'pending' ? 'Pending' : 
                       activity.status === 'in_progress' ? 'In Progress' : 
                       activity.status === 'completed' ? 'Completed' : 
                       activity.status === 'paid' ? 'Paid' : activity.status}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="no-activities">No recent activities</p>
            )}
          </div>
          {hasMoreActivities && (
            <button className="view-all" onClick={showAllActivities}>
              View More
            </button>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="stock-card">
          <h3>⚠️ Low Stock Alerts</h3>
          <div className="stock-list">
            {displayedStock.length > 0 ? (
              displayedStock.map((item, index) => {
                const stock = parseInt(item.stock) || 0;
                const reorderLevel = 10;
                const percent = Math.min((stock / reorderLevel) * 100, 100);
                return (
                  <div key={index} className="stock-item">
                    <div className="stock-info">
                      <strong>{item.part_name}</strong>
                      <span className="stock-brand">{item.brand}</span>
                      <div className="stock-progress">
                        <div 
                          className="stock-progress-bar" 
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="stock-count">Stock: {stock}</span>
                  </div>
                );
              })
            ) : (
              <p className="no-stock">No low stock items</p>
            )}
          </div>
          {hasMoreStock && (
            <button className="view-all" onClick={showAllStock}>
              View More
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default DashboardCharts;