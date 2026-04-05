import { useEffect, useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import "../styles/services.css";

function Services() {
  const [services, setServices] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [problems, setProblems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    vehicle_id: "",
    problem_id: "",
    status: "pending",
    check_in_date: new Date().toISOString().split('T')[0],
    check_out_date: "",
    employee_id: ""
  });

  useEffect(() => {
    loadServices();
    loadVehicles();
    loadProblems();
    loadEmployees();
  }, []);

  const loadServices = async () => {
    try {
      const res = await api.get("/services");
      setServices(res.data);
    } catch (error) {
      console.error("Error loading services:", error);
    }
  };

  const loadVehicles = async () => {
    try {
      const res = await api.get("/vehicles");
      setVehicles(res.data);
    } catch (error) {
      console.error("Error loading vehicles:", error);
    }
  };

  const loadProblems = async () => {
    try {
      const res = await api.get("/problems");
      setProblems(res.data);
    } catch (error) {
      console.error("Error loading problems:", error);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await api.get("/employees");
      setEmployees(res.data);
    } catch (error) {
      console.error("Error loading employees:", error);
    }
  };

  const getVehicleDetails = (vehicleId) => {
    const vehicle = vehicles.find(v => v.vehicle_id === vehicleId);
    return vehicle ? `${vehicle.plate_number} - ${vehicle.car_model}` : 'Unknown Vehicle';
  };

  const getProblemName = (service) => {
    if (service.problem_name) return service.problem_name;
    const problem = problems.find(p => p.problem_id === service.problem_id);
    return problem ? problem.problem_name : 'Unknown Problem';
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.vehicle_id) newErrors.vehicle_id = "Please select a vehicle";
    if (!formData.problem_id) newErrors.problem_id = "Please select a problem";
    if (!formData.check_in_date) newErrors.check_in_date = "Check-in date is required";
    if (formData.status === "completed" && !formData.check_out_date) {
      newErrors.check_out_date = "Check-out date is required for completed services";
    }
    if (formData.check_out_date && formData.check_in_date) {
      if (new Date(formData.check_out_date) < new Date(formData.check_in_date)) {
        newErrors.check_out_date = "Check-out date cannot be before check-in date";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleAdd = async () => {
    if (!validateForm()) return;
    try {
      await api.post("/services", formData);
      resetForm();
      alert("✅ Service added successfully!");
    } catch (error) {
      console.error("Error adding service:", error);
      alert("❌ Failed to add service");
    }
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;
    try {
      await api.put(`/services/${currentId}`, formData);
      resetForm();
      alert("✅ Service updated successfully!");
    } catch (error) {
      console.error("Update error:", error);
      alert("❌ Failed to update service");
    }
  };

  const handleEdit = (service) => {
    setFormData({
      vehicle_id: service.vehicle_id,
      problem_id: service.problem_id,
      status: service.status,
      check_in_date: service.check_in_date.split('T')[0],
      check_out_date: service.check_out_date ? service.check_out_date.split('T')[0] : "",
      employee_id: service.employee_id || ""
    });
    setCurrentId(service.service_id);
    setIsEdit(true);
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        await api.delete(`/services/${id}`);
        loadServices();
        alert("✅ Service deleted successfully!");
      } catch (error) {
        console.error("Error deleting service:", error);
        alert("❌ Failed to delete service");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      vehicle_id: "",
      problem_id: "",
      status: "pending",
      check_in_date: new Date().toISOString().split('T')[0],
      check_out_date: "",
      employee_id: ""
    });
    setShowForm(false);
    setIsEdit(false);
    setCurrentId(null);
    setErrors({});
    loadServices();
  };

  const openAddForm = () => {
    setFormData({
      vehicle_id: "",
      problem_id: "",
      status: "pending",
      check_in_date: new Date().toISOString().split('T')[0],
      check_out_date: "",
      employee_id: ""
    });
    setIsEdit(false);
    setShowForm(true);
    setErrors({});
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return 'status-badge status-pending';
      case 'in_progress': return 'status-badge status-active';
      case 'completed': return 'status-badge status-completed';
      default: return 'status-badge';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const filteredServices = services.filter(service => {
    const vehicle = vehicles.find(v => v.vehicle_id === service.vehicle_id);
    const searchLower = searchTerm.toLowerCase();
    return (
      service.problem_name?.toLowerCase().includes(searchLower) ||
      service.status?.toLowerCase().includes(searchLower) ||
      service.employee_name?.toLowerCase().includes(searchLower) ||
      vehicle?.plate_number?.toLowerCase().includes(searchLower) ||
      vehicle?.car_model?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="services-page">
      <div className="header">
        <h2>Services</h2>
        <div className="header-right">
          <button className="problems-btn" onClick={() => navigate("/problems")}>
            Problems
          </button>
          <input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="add-btn" onClick={openAddForm}>
            + New Service
          </button>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="form-box">
            <h3>{isEdit ? "Edit Service" : "Add New Service"}</h3>

            <div className="form-group">
              <select
                name="vehicle_id"
                value={formData.vehicle_id}
                onChange={handleChange}
                className={errors.vehicle_id ? "error-input" : ""}
              >
                <option value="">Select Vehicle</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                    {vehicle.plate_number} - {vehicle.car_model}
                  </option>
                ))}
              </select>
              {errors.vehicle_id && <span className="error-message">{errors.vehicle_id}</span>}
            </div>

            <div className="form-group">
              <select
                name="problem_id"
                value={formData.problem_id}
                onChange={handleChange}
                className={errors.problem_id ? "error-input" : ""}
              >
                <option value="">Select Problem</option>
                {problems.map(problem => (
                  <option key={problem.problem_id} value={problem.problem_id}>
                    {problem.problem_name}
                  </option>
                ))}
              </select>
              {errors.problem_id && <span className="error-message">{errors.problem_id}</span>}
            </div>

            <div className="form-group">
              <select
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
              >
                <option value="">Assign to Employee</option>
                {employees.map(emp => (
                  <option key={emp.employee_id} value={emp.employee_id}>
                    {emp.name} - {emp.position}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <input
                  type="date"
                  name="check_in_date"
                  value={formData.check_in_date}
                  onChange={handleChange}
                  className={errors.check_in_date ? "error-input" : ""}
                />
                {errors.check_in_date && <span className="error-message">{errors.check_in_date}</span>}
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <input
                  type="date"
                  name="check_out_date"
                  value={formData.check_out_date}
                  onChange={handleChange}
                  placeholder="Check-out Date"
                  className={errors.check_out_date ? "error-input" : ""}
                  disabled={formData.status !== 'completed'}
                />
                {errors.check_out_date && <span className="error-message">{errors.check_out_date}</span>}
              </div>
            </div>

            <div className="form-actions">
              {isEdit ? (
                <button className="save-btn" onClick={handleUpdate}>Update Service</button>
              ) : (
                <button className="save-btn" onClick={handleAdd}>Save Service</button>
              )}
              <button className="cancel-btn" onClick={resetForm}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {!showForm && (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>{/* */}
                <th>ID</th>
                <th>Vehicle</th>
                <th>Problem</th>
                <th>Assigned Employee</th>
                <th>Status</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th className="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.length > 0 ? (
                filteredServices.map((service) => (
                  <tr key={service.service_id}>{/* */}
                    <td>{service.service_id}</td>
                    <td>{getVehicleDetails(service.vehicle_id)}</td>
                    <td>{service.problem_name || 'Unknown Problem'}</td>
                    <td>{service.employee_name || '-'}</td>
                    <td><span className={getStatusBadge(service.status)}>{getStatusText(service.status)}</span></td>
                    <td>{new Date(service.check_in_date).toLocaleDateString()}</td>
                    <td>{service.check_out_date ? new Date(service.check_out_date).toLocaleDateString() : '-'}</td>
                    <td className="actions-cell">
                      <button className="edit-btn" onClick={() => handleEdit(service)} title="Edit service">✏️</button>
                      <button className="delete-btn" onClick={() => handleDelete(service.service_id)} title="Delete service">🗑️</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>{/* */}
                  <td colSpan="8" className="text-center">
                    {searchTerm ? `No services matching "${searchTerm}"` : "No services found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Services;