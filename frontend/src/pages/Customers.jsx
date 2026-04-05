// pages/Customers.jsx
import { useEffect, useState } from "react";
import api from "../utils/api";
import "../styles/customer.css";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: ""
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const res = await api.get("/customers");
      setCustomers(res.data);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  // Validation functions (unchanged)
  const validateName = (name) => {
    const nameRegex = /^[A-Za-z\s]{3,50}$/;
    return nameRegex.test(name);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^\d{8,11}$/;
    return phoneRegex.test(phone);
  };

  const validateAddress = (address) => {
    const addressRegex = /^[A-Z][A-Za-z]+$/;
    return addressRegex.test(address);
  };

  const isNameExists = (name, currentCustomerId = null) => {
    return customers.some(customer => 
      customer.name.toLowerCase() === name.toLowerCase() && 
      customer.customer_id !== currentCustomerId
    );
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (!validateName(formData.name)) {
      newErrors.name = "Name must be at least 3 characters and contain only letters";
    } else if (isNameExists(formData.name, currentId)) {
      newErrors.name = "This name already exists. Please use a different name";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = "Phone must be 8-11 digits, no spaces allowed";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    } else if (!validateAddress(formData.address)) {
      newErrors.address = "Address must start with capital letter and no spaces (e.g., Yangon)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormChange = (e) => {
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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleAdd = async () => {
    if (!validateForm()) return;

    try {
      await api.post("/customers", formData);
      resetForm();
      alert("✅ Customer added successfully!");
    } catch (error) {
      console.error("Error adding customer:", error);
      alert("❌ Failed to add customer");
    }
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    try {
      await api.put(`/customers/${currentId}`, formData);
      resetForm();
      alert("✅ Customer updated successfully!");
    } catch (error) {
      console.error("Error updating customer:", error);
      alert("❌ Failed to update customer");
    }
  };

  const handleEdit = (customer) => {
    setFormData({
      name: customer.name,
      phone: customer.phone,
      address: customer.address
    });
    setCurrentId(customer.customer_id);
    setIsEdit(true);
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        await api.delete(`/customers/${id}`);
        loadCustomers();
        alert("✅ Customer deleted successfully!");
      } catch (error) {
        console.error("Error deleting customer:", error);
        alert("❌ Failed to delete customer");
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: "", phone: "", address: "" });
    setShowForm(false);
    setIsEdit(false);
    setCurrentId(null);
    setErrors({});
    loadCustomers();
  };

  const openAddForm = () => {
    setFormData({ name: "", phone: "", address: "" });
    setIsEdit(false);
    setShowForm(true);
    setErrors({});
  };

  const filteredCustomers = customers.filter(customer => {
    if (!searchTerm) return true;
    return (
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="customers-page">
      <div className="header">
        <h2>Customers</h2>
        <div className="header-right">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          <button
            className="add-btn"
            onClick={openAddForm}
          >
            + Add Customer
          </button>
        </div>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="modal-overlay">
          <div className="form-box">
            <h3>{isEdit ? "Edit Customer" : "Add Customer"}</h3>
            
            <div className="form-group">
              <input
                type="text"
                name="name"
                placeholder="Name (e.g., Aung Pyae Son Oo)"
                value={formData.name}
                onChange={handleFormChange}
                className={errors.name ? "error-input" : ""}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <input
                type="text"
                name="phone"
                placeholder="Phone (8-11 digits, no spaces)"
                value={formData.phone}
                onChange={handleFormChange}
                className={errors.phone ? "error-input" : ""}
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <input
                type="text"
                name="address"
                placeholder="Address (Capital letter, no spaces e.g., Yangon)"
                value={formData.address}
                onChange={handleFormChange}
                className={errors.address ? "error-input" : ""}
              />
              {errors.address && <span className="error-message">{errors.address}</span>}
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
                <th>Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th className="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((c) => (
                  <tr key={c.customer_id}>
                    <td>{c.customer_id}</td>
                    <td>{c.name}</td>
                    <td>{c.phone}</td>
                    <td>{c.address}</td>
                    <td className="actions-cell">
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(c)}
                        title="Edit customer"
                      >
                        ✏️
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(c.customer_id)}
                        title="Delete customer"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center">
                    {searchTerm ? `No customers matching "${searchTerm}"` : "No customers found"}
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

export default Customers;