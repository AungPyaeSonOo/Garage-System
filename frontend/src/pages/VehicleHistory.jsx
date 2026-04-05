// pages/VehicleHistory.jsx
import { useEffect, useState } from "react";
import api from "../utils/api";
import { useParams, Link } from "react-router-dom";
import "../styles/vehicle-history.css";

function VehicleHistory() {
  const { vehicleId } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("services");

  useEffect(() => {
    loadVehicleData();
  }, [vehicleId]);

  const loadVehicleData = async () => {
    setLoading(true);
    try {
      const vehicleRes = await api.get(`/vehicles/${vehicleId}`);
      setVehicle(vehicleRes.data);

      const servicesRes = await api.get(`/services/vehicle/${vehicleId}`);
      
      const servicesWithInvoices = await Promise.all(
        servicesRes.data.map(async (service) => {
          try {
            const invoiceRes = await api.get(`/invoices/service/${service.service_id}`);
            return {
              ...service,
              invoice: invoiceRes.data
            };
          } catch (error) {
            return {
              ...service,
              invoice: null
            };
          }
        })
      );
      setServices(servicesWithInvoices);

    } catch (error) {
      console.error("Error loading vehicle history:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US').format(price) + ' Ks';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed':
        return <span className="status-badge status-active">Completed</span>;
      case 'in_progress':
        return <span className="status-badge status-pending">In Progress</span>;
      case 'pending':
        return <span className="status-badge status-inactive">Pending</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading vehicle history...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="error-message">
        <p>Vehicle not found</p>
        <Link to="/vehicles">Back to Vehicles</Link>
      </div>
    );
  }

  return (
    <div className="vehicle-history-page">
      {/* Vehicle Header */}
      <div className="vehicle-header">
        <div className="vehicle-info">
          <h2>
            🚗 {vehicle.plate_number}
            <span className="vehicle-model">{vehicle.car_model} ({vehicle.year})</span>
          </h2>
          <p className="vehicle-details">
            Engine: {vehicle.engine_number} | 
            Customer : {vehicle.customer_name}
          </p>
        </div>
        <Link to="/vehicles" className="back-btn">
          ← Back to Vehicles
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="history-stats">
        <div className="stat-card small">
          <div className="stat-icon">🔧</div>
          <div className="stat-info">
            <h3>Total Services</h3>
            <p>{services.length}</p>
          </div>
        </div>
        <div className="stat-card small">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Total Spent</h3>
            <p>{formatPrice(services.reduce((sum, s) => sum + (s.invoice?.total_cost || 0), 0))}</p>
          </div>
        </div>
        <div className="stat-card small">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>Completed</h3>
            <p>{services.filter(s => s.status === 'completed').length}</p>
          </div>
        </div>
        <div className="stat-card small">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>In Progress</h3>
            <p>{services.filter(s => s.status === 'in_progress' || s.status === 'pending').length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="history-tabs">
        <button 
          className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          Service History
        </button>
        <button 
          className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          Invoices & Payments
        </button>
        <button 
          className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          Timeline
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Service History Tab */}
        {activeTab === 'services' && (
          <div className="services-history">
            {services.length === 0 ? (
              <div className="empty-state">
                <p>No service history found for this vehicle</p>
              </div>
            ) : (
              <div className="services-list">
                {services.map((service) => (
                  <div key={service.service_id} className="history-card">
                    <div className="card-header">
                      <div className="service-id">Service #{service.service_id}</div>
                      <div>{getStatusBadge(service.status)}</div>
                    </div>
                    <div className="card-body">
                      <div className="problem-section">
                        <h4>Problem:</h4>
                        <p>{service.problem_name}</p>
                      </div>
                      <div className="dates">
                        <div>
                          <strong>Check In:</strong> {formatDate(service.check_in_date)}
                        </div>
                        <div>
                          <strong>Check Out:</strong> {service.check_out_date ? formatDate(service.check_out_date) : 'Not completed'}
                        </div>
                      </div>
                      {service.invoice && (
                        <div className="invoice-summary">
                          <h4>Invoice #{service.invoice.invoice_id}</h4>
                          <div className="invoice-details">
                            <span>Total: {formatPrice(service.invoice.total_cost)}</span>
                            <span>Paid: {formatPrice(service.invoice.paid_amount)}</span>
                            <span className={service.invoice.total_cost - service.invoice.paid_amount > 0 ? 'balance-due' : 'paid'}>
                              Balance: {formatPrice(service.invoice.total_cost - service.invoice.paid_amount)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="invoices-history">
            {services.filter(s => s.invoice).length === 0 ? (
              <div className="empty-state">
                <p>No invoices found for this vehicle</p>
              </div>
            ) : (
              <div className="invoices-list">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Invoice ID</th>
                      <th>Service</th>
                      <th>Total</th>
                      <th>Paid</th>
                      <th>Balance</th>
                      <th>Method</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.filter(s => s.invoice).map((service) => (
                      <tr key={service.invoice.invoice_id}>
                        <td>#{service.invoice.invoice_id}</td>
                        <td>{service.problem_name.substring(0, 30)}...</td>
                        <td>{formatPrice(service.invoice.total_cost)}</td>
                        <td>{formatPrice(service.invoice.paid_amount)}</td>
                        <td className={service.invoice.total_cost - service.invoice.paid_amount > 0 ? 'balance-due' : 'paid'}>
                          {formatPrice(service.invoice.total_cost - service.invoice.paid_amount)}
                        </td>
                        <td>{service.invoice.payment_method}</td>
                        <td>{formatDate(service.invoice.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <div className="timeline">
            {services.length === 0 ? (
              <div className="empty-state">
                <p>No timeline available</p>
              </div>
            ) : (
              <div className="timeline-list">
                {services.map((service, index) => (
                  <div key={service.service_id} className="timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <div className="timeline-date">📅 {formatDate(service.check_in_date)}</div>
                      <h4>{service.problem_name}</h4>
                      <p>Status: {service.status}</p>
                      {service.invoice && (
                        <p className="timeline-amount">Amount: {formatPrice(service.invoice.total_cost)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default VehicleHistory;