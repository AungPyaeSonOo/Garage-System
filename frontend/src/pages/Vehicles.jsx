// pages/Vehicles.jsx
import { useEffect, useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import "../styles/vehicle.css";

function Vehicles() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    customer_id: "",
    plate_number: "",
    car_model: "",
    engine_number: "",
    year: ""
  });

  useEffect(() => {
    loadVehicles();
    loadCustomers();
  }, []);

  const loadVehicles = async () => {
    try {
      const res = await api.get("/vehicles");
      setVehicles(res.data);
    } catch (error) {
      console.error("Error loading vehicles:", error);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await api.get("/customers");
      setCustomers(res.data);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  // Validation functions (unchanged)
  const validatePlateNumber = (plate) => {
    const plateRegex = /^[0-9][A-Z]-\d{4}$/;
    return plateRegex.test(plate);
  };

  const validateYear = (year) => {
    const currentYear = new Date().getFullYear();
    return year >= 1900 && year <= currentYear + 1;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customer_id) {
      newErrors.customer_id = "Please select a customer";
    }

    if (!formData.plate_number.trim()) {
      newErrors.plate_number = "Plate number is required";
    } else if (!validatePlateNumber(formData.plate_number)) {
      newErrors.plate_number = "Format: 1N-1234 (1 letter, hyphen, 4 numbers)";
    }

    if (!formData.car_model.trim()) {
      newErrors.car_model = "Car model is required";
    }

    if (!formData.engine_number.trim()) {
      newErrors.engine_number = "Engine number is required";
    }

    if (!formData.year) {
      newErrors.year = "Year is required";
    } else if (!validateYear(parseInt(formData.year))) {
      newErrors.year = `Year must be between 1900 and ${new Date().getFullYear() + 1}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleAdd = async () => {
    if (!validateForm()) return;

    try {
      await api.post("/vehicles", formData);
      resetForm();
      alert("✅ Vehicle added successfully!");
    } catch (error) {
      console.error("Error adding vehicle:", error);
      alert("❌ Failed to add vehicle");
    }
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    try {
      await api.put(`/vehicles/${currentId}`, formData);
      resetForm();
      alert("✅ Vehicle updated successfully!");
    } catch (error) {
      console.error("Error updating vehicle:", error);
      alert("❌ Failed to update vehicle");
    }
  };

  const handleEdit = (vehicle) => {
    setFormData({
      customer_id: vehicle.customer_id,
      plate_number: vehicle.plate_number,
      car_model: vehicle.car_model,
      engine_number: vehicle.engine_number,
      year: vehicle.year
    });
    setCurrentId(vehicle.vehicle_id);
    setIsEdit(true);
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      try {
        await api.delete(`/vehicles/${id}`);
        loadVehicles();
        alert("✅ Vehicle deleted successfully!");
      } catch (error) {
        console.error("Error deleting vehicle:", error);
        alert("❌ Failed to delete vehicle");
      }
    }
  };

  const handleViewHistory = (vehicleId) => {
    navigate(`/vehicles/${vehicleId}/history`);
  };

  const resetForm = () => {
    setFormData({
      customer_id: "",
      plate_number: "",
      car_model: "",
      engine_number: "",
      year: ""
    });
    setShowForm(false);
    setIsEdit(false);
    setCurrentId(null);
    setErrors({});
    loadVehicles();
  };

  const openAddForm = () => {
    setFormData({
      customer_id: "",
      plate_number: "",
      car_model: "",
      engine_number: "",
      year: ""
    });
    setIsEdit(false);
    setShowForm(true);
    setErrors({});
  };

  const filteredVehicles = vehicles.filter(vehicle => 
    vehicle.plate_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.car_model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.engine_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.customer_id === customerId);
    return customer ? customer.name : 'Unknown';
  };

  return (
    <div className="vehicles-page">
      <div className="header">
        <h2>Vehicles</h2>
        <div className="header-right">
          <input
            type="text"
            placeholder="Search vehicles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button
            className="add-btn"
            onClick={openAddForm}
          >
            + Add Vehicle
          </button>
        </div>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="modal-overlay">
          <div className="form-box">
            <h3>{isEdit ? "Edit Vehicle" : "Add Vehicle"}</h3>

            <div className="form-group">
              <select
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                className={errors.customer_id ? "error-input" : ""}
              >
                <option value="">Select Customer</option>
                {customers.map(customer => (
                  <option key={customer.customer_id} value={customer.customer_id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              {errors.customer_id && <span className="error-message">{errors.customer_id}</span>}
            </div>

            <div className="form-group">
              <input
                type="text"
                name="plate_number"
                placeholder="Plate Number (e.g., 1N-1234)"
                value={formData.plate_number}
                onChange={handleChange}
                className={errors.plate_number ? "error-input" : ""}
              />
              {errors.plate_number && <span className="error-message">{errors.plate_number}</span>}
            </div>

            <div className="form-group">
              <input
                type="text"
                name="car_model"
                placeholder="Car Model (e.g., Toyota Vitz)"
                value={formData.car_model}
                onChange={handleChange}
                className={errors.car_model ? "error-input" : ""}
              />
              {errors.car_model && <span className="error-message">{errors.car_model}</span>}
            </div>

            <div className="form-group">
              <input
                type="text"
                name="engine_number"
                placeholder="Engine Number"
                value={formData.engine_number}
                onChange={handleChange}
                className={errors.engine_number ? "error-input" : ""}
              />
              {errors.engine_number && <span className="error-message">{errors.engine_number}</span>}
            </div>

            <div className="form-group">
              <input
                type="number"
                name="year"
                placeholder="Year (e.g., 2020)"
                value={formData.year}
                onChange={handleChange}
                min="1900"
                max={new Date().getFullYear() + 1}
                className={errors.year ? "error-input" : ""}
              />
              {errors.year && <span className="error-message">{errors.year}</span>}
            </div>

            <div className="form-actions">
              {isEdit ? (
                <button className="save-btn" onClick={handleUpdate}>Update</button>
              ) : (
                <button className="save-btn" onClick={handleAdd}>Save</button>
              )}
              <button className="cancel-btn" onClick={resetForm}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE */}
      {!showForm && (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Owner</th>
                <th>Plate Number</th>
                <th>Model</th>
                <th>Engine Number</th>
                <th>Year</th>
                <th className="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((v) => (
                  <tr key={v.vehicle_id}>
                    <td>{v.vehicle_id}</td>
                    <td>{getCustomerName(v.customer_id)}</td>
                    <td><strong>{v.plate_number}</strong></td>
                    <td>{v.car_model}</td>
                    <td>{v.engine_number}</td>
                    <td>{v.year}</td>
                    <td className="actions-cell">
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(v)}
                        title="Edit vehicle"
                      >
                        ✏️
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(v.vehicle_id)}
                        title="Delete vehicle"
                      >
                        🗑️
                      </button>
                      <button
                        className="history-btn"
                        onClick={() => handleViewHistory(v.vehicle_id)}
                        title="View service history"
                      >
                        📋
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center">
                    {searchTerm ? `No vehicles matching "${searchTerm}"` : "No vehicles found"}
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

export default Vehicles;