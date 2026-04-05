import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";  // <-- added useNavigate
import api from "../utils/api";
import "../styles/employee-performance.css";

function EmployeePerformance() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();  // <-- for back navigation
  const employeeIdParam = searchParams.get("employee");

  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchPerformance();
  }, [selectedYear, selectedMonth, employeeIdParam]);

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      let url = `/services/employee-performance/${selectedYear}/${selectedMonth}`;
      if (employeeIdParam) {
        url += `?employee=${employeeIdParam}`;
      }
      const res = await api.get(url);
      setPerformanceData(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load employee performance data");
    } finally {
      setLoading(false);
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const pageTitle = employeeIdParam
    ? `📊 Performance of ${performanceData[0]?.name || 'Employee'}`
    : "📊 All Employees Performance";

  // Handler to go back to employees page
  const handleBack = () => {
    navigate("/employees");
  };

  return (
    <div className="employee-performance-container">
      <div className="header">
        <div className="header-left">                     {/* New left container */}
        <button className="back-button" onClick={handleBack} aria-label="Back to employees">
  ←
</button>
          <h2>{pageTitle}</h2>
        </div>
        <div className="month-selector">
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
            {years.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
            {months.map((month, idx) => <option key={idx+1} value={idx+1}>{month}</option>)}
          </select>
          <button onClick={fetchPerformance} className="refresh-btn">Refresh</button>
        </div>
      </div>

      {loading && <div className="loading-spinner">Loading...</div>}
      {error && <div className="error-message">{error}</div>}

      {!loading && !error && (
        <div className="performance-grid">
          {performanceData.map(employee => (
            <div key={employee.employee_id} className="employee-card">
              <div className="employee-header">
                <h3>{employee.name}</h3>
                <span className="position-badge">{employee.position}</span>
              </div>
              <div className="stats-row">
                <div className="stat">
                  <span className="stat-label">Total Services</span>
                  <span className="stat-value">{employee.total_services}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Completed</span>
                  <span className="stat-value">{employee.completed_services}</span>
                </div>
              </div>
              {employee.services && employee.services.length > 0 ? (
                <div className="services-list">
                  <h4>Services this month:</h4>
                  <ul>
                    {employee.services.map(service => (
                      <li key={service.service_id} className="service-item">
                        <span className="service-vehicle">{service.plate_number || 'N/A'}</span>
                        <span className="service-problem">{service.problem_name || 'No problem'}</span>
                        <span className={`service-status ${service.status}`}>{service.status}</span>
                        <span className="service-date">
                          {new Date(service.check_in_date).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="no-services">No services assigned this month.</p>
              )}
            </div>
          ))}
          {performanceData.length === 0 && (
            <p className="no-data">No employee data found for this month.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default EmployeePerformance;