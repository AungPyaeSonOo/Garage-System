import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "../styles/employee.css";

function Employees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    position: "",
    salary: ""
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const res = await api.get("/employees");
      setEmployees(res.data);
    } catch (error) {
      console.error("Error loading employees:", error);
    }
  };

  const validateName = (name) => {
    const nameRegex = /^[A-Za-z\s]{3,50}$/;
    return nameRegex.test(name);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^\d{8,11}$/;
    return phoneRegex.test(phone);
  };

  const validateSalary = (salary) => {
    return salary > 0 && salary < 10000000;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (!validateName(formData.name)) {
      newErrors.name = "Name must be at least 3 characters and contain only letters";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = "Phone must be 8-11 digits, no spaces allowed";
    }
    if (!formData.position.trim()) {
      newErrors.position = "Position is required";
    }
    if (!formData.salary) {
      newErrors.salary = "Salary is required";
    } else if (isNaN(formData.salary) || formData.salary <= 0) {
      newErrors.salary = "Salary must be a positive number";
    } else if (!validateSalary(parseFloat(formData.salary))) {
      newErrors.salary = "Salary must be between 1 and 10,000,000";
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
      await api.post("/employees", formData);
      resetForm();
      alert("✅ Employee added successfully!");
    } catch (error) {
      console.error("Error adding employee:", error);
      alert("❌ Failed to add employee");
    }
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;
    try {
      await api.put(`/employees/${currentId}`, formData);
      resetForm();
      alert("✅ Employee updated successfully!");
    } catch (error) {
      console.error("Error updating employee:", error);
      alert("❌ Failed to update employee");
    }
  };

  const handleEdit = (employee) => {
    setFormData({
      name: employee.name,
      phone: employee.phone,
      position: employee.position,
      salary: employee.salary
    });
    setCurrentId(employee.employee_id);
    setIsEdit(true);
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        await api.delete(`/employees/${id}`);
        loadEmployees();
        alert("✅ Employee deleted successfully!");
      } catch (error) {
        console.error("Error deleting employee:", error);
        alert("❌ Failed to delete employee");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      position: "",
      salary: ""
    });
    setShowForm(false);
    setIsEdit(false);
    setCurrentId(null);
    setErrors({});
    loadEmployees();
  };

  const openAddForm = () => {
    setFormData({
      name: "",
      phone: "",
      position: "",
      salary: ""
    });
    setIsEdit(false);
    setShowForm(true);
    setErrors({});
  };

  const formatSalary = (salary) => {
    return new Intl.NumberFormat('en-US').format(salary) + ' Ks';
  };

  const filteredEmployees = employees.filter(employee => {
    const searchLower = searchTerm.toLowerCase();
    return (
      employee.name?.toLowerCase().includes(searchLower) ||
      employee.phone?.toLowerCase().includes(searchLower) ||
      employee.position?.toLowerCase().includes(searchLower)
    );
  });

  const positions = [
    "Mechanic",
    "Senior Mechanic",
    "Service Advisor",
    "Manager",
    "Receptionist",
    "Cleaner",
    "Electrician",
    "Painter"
  ];

  return (
    <div className="employees-page">
      <div className="header">
        <div className="header-left">
          <h2>Employees</h2>
          <button
            className="global-performance-btn"
            onClick={() => navigate("/employee-performance")}
          >
            📊 All Performance
          </button>
        </div>
        <div className="header-right">
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="add-btn" onClick={openAddForm}>
            + Add Employee
          </button>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="form-box">
            <h3>{isEdit ? "Edit Employee" : "Add New Employee"}</h3>

            <div className="form-group">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? "error-input" : ""}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <input
                type="text"
                name="phone"
                placeholder="Phone Number (8-11 digits)"
                value={formData.phone}
                onChange={handleChange}
                className={errors.phone ? "error-input" : ""}
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <select
                name="position"
                value={formData.position}
                onChange={handleChange}
                className={errors.position ? "error-input" : ""}
              >
                <option value="">Select Position</option>
                {positions.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
              {errors.position && <span className="error-message">{errors.position}</span>}
            </div>

            <div className="form-group">
              <input
                type="number"
                name="salary"
                placeholder="Monthly Salary (Ks)"
                value={formData.salary}
                onChange={handleChange}
                min="0"
                step="10000"
                className={errors.salary ? "error-input" : ""}
              />
              {errors.salary && <span className="error-message">{errors.salary}</span>}
            </div>

            <div className="form-actions">
              {isEdit ? (
                <button className="save-btn" onClick={handleUpdate}>Update Employee</button>
              ) : (
                <button className="save-btn" onClick={handleAdd}>Save Employee</button>
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
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Position</th>
                <th>Salary</th>
                <th>Performance</th>
                <th className="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => (
                  <tr key={emp.employee_id}>
                    <td>{emp.employee_id}</td>
                    <td><strong>{emp.name}</strong></td>
                    <td>{emp.phone}</td>
                    <td>{emp.position}</td>
                    <td>{formatSalary(emp.salary)}</td>
                    <td>
                      <button
                        className="performance-btn"
                        onClick={() => navigate(`/employee-performance?employee=${emp.employee_id}`)}
                        title="View performance"
                      >
                        📊
                      </button>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(emp)}
                        title="Edit employee"
                      >
                        ✏️
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(emp.employee_id)}
                        title="Delete employee"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center">
                    {searchTerm ? `No employees matching "${searchTerm}"` : "No employees found"}
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

export default Employees;