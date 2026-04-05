// pages/Parts.jsx
import { useEffect, useState } from "react";
import api from "../utils/api";
import "../styles/part.css";

function Parts() {
  const [parts, setParts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    part_name: "",
    brand: "",
    stock: "",
    buy_price: "",
    sell_price: ""
  });

  useEffect(() => {
    loadParts();
  }, []);

  const loadParts = async () => {
    try {
      const res = await api.get("/parts");
      setParts(res.data);
    } catch (error) {
      console.error("Error loading parts:", error);
    }
  };

  // Validation functions
  const validatePartName = (name) => {
    return name.length >= 2 && name.length <= 100;
  };

  const validateStock = (stock) => {
    return stock >= 0 && stock <= 99999;
  };

  const validatePrice = (price) => {
    return price > 0 && price < 10000000;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.part_name.trim()) {
      newErrors.part_name = "Part name is required";
    } else if (!validatePartName(formData.part_name)) {
      newErrors.part_name = "Part name must be between 2 and 100 characters";
    }

    if (!formData.brand.trim()) {
      newErrors.brand = "Brand is required";
    }

    if (formData.stock === "" || formData.stock === null) {
      newErrors.stock = "Stock quantity is required";
    } else if (!validateStock(parseInt(formData.stock))) {
      newErrors.stock = "Stock must be between 0 and 99,999";
    }

    if (!formData.buy_price) {
      newErrors.buy_price = "Buy price is required";
    } else if (!validatePrice(parseFloat(formData.buy_price))) {
      newErrors.buy_price = "Buy price must be between 1 and 10,000,000";
    }

    if (!formData.sell_price) {
      newErrors.sell_price = "Sell price is required";
    } else if (!validatePrice(parseFloat(formData.sell_price))) {
      newErrors.sell_price = "Sell price must be between 1 and 10,000,000";
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

    setLoading(true);
    try {
      await api.post("/parts", formData);
      resetForm();
      alert("✅ Part added successfully!");
    } catch (error) {
      console.error("Error adding part:", error);
      alert("❌ Failed to add part");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await api.put(`/parts/${currentId}`, formData);
      resetForm();
      alert("✅ Part updated successfully!");
    } catch (error) {
      console.error("Error updating part:", error);
      alert("❌ Failed to update part");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (part) => {
    setFormData({
      part_name: part.part_name,
      brand: part.brand,
      stock: part.stock,
      buy_price: part.buy_price,
      sell_price: part.sell_price
    });
    setCurrentId(part.part_id);
    setIsEdit(true);
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this part?")) {
      try {
        await api.delete(`/parts/${id}`);
        loadParts();
        alert("✅ Part deleted successfully!");
      } catch (error) {
        console.error("Error deleting part:", error);
        alert("❌ Failed to delete part");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      part_name: "",
      brand: "",
      stock: "",
      buy_price: "",
      sell_price: ""
    });
    setShowForm(false);
    setIsEdit(false);
    setCurrentId(null);
    setErrors({});
    loadParts();
  };

  const openAddForm = () => {
    setFormData({
      part_name: "",
      brand: "",
      stock: "",
      buy_price: "",
      sell_price: ""
    });
    setIsEdit(false);
    setShowForm(true);
    setErrors({});
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US').format(price) + ' Ks';
  };

  const getStockStatus = (stock) => {
    if (stock <= 0) return 'status-badge status-inactive';
    if (stock < 10) return 'status-badge status-pending';
    return 'status-badge status-active';
  };

  const getStockText = (stock) => {
    if (stock <= 0) return 'Out of Stock';
    if (stock < 10) return 'Low Stock';
    return 'In Stock';
  };

  const filteredParts = parts.filter(part => {
    const searchLower = searchTerm.toLowerCase();
    return (
      part.part_name?.toLowerCase().includes(searchLower) ||
      part.brand?.toLowerCase().includes(searchLower)
    );
  });

  // Common brands for dropdown
  const commonBrands = [
    "Toyota",
    "Honda",
    "Suzuki",
    "Nissan",
    "Mitsubishi",
    "Mazda",
    "BMW",
    "Mercedes",
    "Hyundai",
    "Kia",
    "Generic"
  ];

  return (
    <div className="parts-page">
      <div className="header">
        <h2>Parts Inventory</h2>
        <div className="header-right">
          <input
            type="text"
            placeholder="Search parts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button
            className="add-btn"
            onClick={openAddForm}
            disabled={loading}
          >
            + Add Part
          </button>
        </div>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="modal-overlay">
          <div className="form-box">
            <h3>{isEdit ? "Edit Part" : "Add New Part"}</h3>

            <div className="form-group">
              <input
                type="text"
                name="part_name"
                placeholder="Part Name (e.g., Brake Pad)"
                value={formData.part_name}
                onChange={handleChange}
                className={errors.part_name ? "error-input" : ""}
              />
              {errors.part_name && <span className="error-message">{errors.part_name}</span>}
            </div>

            <div className="form-group">
              <select
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className={errors.brand ? "error-input" : ""}
              >
                <option value="">Select Brand</option>
                {commonBrands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
              {errors.brand && <span className="error-message">{errors.brand}</span>}
            </div>

            <div className="form-group">
              <input
                type="number"
                name="stock"
                placeholder="Stock Quantity"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                className={errors.stock ? "error-input" : ""}
              />
              {errors.stock && <span className="error-message">{errors.stock}</span>}
            </div>

            <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <input
                  type="number"
                  name="buy_price"
                  placeholder="Buy Price (Ks)"
                  value={formData.buy_price}
                  onChange={handleChange}
                  min="0"
                  step="100"
                  className={errors.buy_price ? "error-input" : ""}
                />
                {errors.buy_price && <span className="error-message">{errors.buy_price}</span>}
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <input
                  type="number"
                  name="sell_price"
                  placeholder="Sell Price (Ks)"
                  value={formData.sell_price}
                  onChange={handleChange}
                  min="0"
                  step="100"
                  className={errors.sell_price ? "error-input" : ""}
                />
                {errors.sell_price && <span className="error-message">{errors.sell_price}</span>}
              </div>
            </div>

            <div className="form-actions">
              {isEdit ? (
                <button className="save-btn" onClick={handleUpdate} disabled={loading}>Update Part</button>
              ) : (
                <button className="save-btn" onClick={handleAdd} disabled={loading}>Save Part</button>
              )}
              <button className="cancel-btn" onClick={resetForm} disabled={loading}>Cancel</button>
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
                <th>Part Name</th>
                <th>Brand</th>
                <th>Stock</th>
                <th>Buy Price</th>
                <th>Sell Price</th>
                <th>Profit</th>
                <th>Status</th>
                <th className="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.length > 0 ? (
                filteredParts.map((part) => {
                  const profit = (part.sell_price - part.buy_price) * part.stock;
                  return (
                    <tr key={part.part_id}>
                      <td>{part.part_id}</td>
                      <td><strong>{part.part_name}</strong></td>
                      <td>{part.brand}</td>
                      <td>{part.stock}</td>
                      <td>{formatPrice(part.buy_price)}</td>
                      <td>{formatPrice(part.sell_price)}</td>
                      <td style={{ color: profit > 0 ? '#10b981' : '#ef4444' }}>
                        {formatPrice(profit)}
                       </td>
                      <td>
                        <span className={getStockStatus(part.stock)}>
                          {getStockText(part.stock)}
                        </span>
                       </td>
                      <td className="actions-cell">
                        <button
                          className="edit-btn"
                          onClick={() => handleEdit(part)}
                          title="Edit part"
                          disabled={loading}
                        >
                          ✏️
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(part.part_id)}
                          title="Delete part"
                          disabled={loading}
                        >
                          🗑️
                        </button>
                       </td>
                     </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="text-center">
                    {searchTerm ? `No parts matching "${searchTerm}"` : "No parts found"}
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

export default Parts;