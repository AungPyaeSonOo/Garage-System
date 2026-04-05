import { useEffect, useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import "../styles/invoices.css";

function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [services, setServices] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [parts, setParts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedParts, setSelectedParts] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [customParts, setCustomParts] = useState([]);        // custom parts state
  const [newCustomPart, setNewCustomPart] = useState({       // form for adding a custom part
    part_name: "",
    price: "",
    quantity: 1
  });

  const [formData, setFormData] = useState({
    total_cost: 0,
    paid_amount: "",
    payment_method: "cash",
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadInvoices();
    loadServices();
    loadParts();
  }, []);

  // Auto-calculate total cost (including custom parts)
  useEffect(() => {
    const servicesTotal = selectedServices.reduce((sum, service) => {
      return sum + (parseFloat(service.problem_fee) || 0);
    }, 0);
    
    const partsTotal = selectedParts.reduce((sum, part) => {
      return sum + (part.price * part.quantity);
    }, 0);

    const customTotal = customParts.reduce((sum, cp) => {
      return sum + (cp.price * cp.quantity);
    }, 0);
    
    setFormData(prev => ({
      ...prev,
      total_cost: servicesTotal + partsTotal + customTotal
    }));
  }, [selectedServices, selectedParts, customParts]);

  const loadInvoices = async () => {
    try {
      const res = await api.get("/invoices");
      const invoicesData = res.data;
      
      const invoicesWithDetails = await Promise.all(
        invoicesData.map(async (invoice) => {
          try {
            const servicesRes = await api.get(`/invoice-services/invoice/${invoice.invoice_id}`);
            const invoiceServices = servicesRes.data;
            
            const partsRes = await api.get(`/invoice-details/invoice/${invoice.invoice_id}`);
            const invoiceParts = partsRes.data;

            const customPartsRes = await api.get(`/custom-parts/invoice/${invoice.invoice_id}`);
            const invoiceCustomParts = customPartsRes.data;
            
            return {
              ...invoice,
              services: invoiceServices,
              parts: invoiceParts,
              customParts: invoiceCustomParts
            };
          } catch (error) {
            return {
              ...invoice,
              services: [],
              parts: [],
              customParts: []
            };
          }
        })
      );
      
      setInvoices(invoicesWithDetails);
    } catch (error) {
      console.error("Error loading invoices:", error);
    }
  };

  const loadServices = async () => {
    try {
      const res = await api.get("/services");
      setServices(res.data);
    } catch (error) {
      console.error("Error loading services:", error);
    }
  };

  const fetchAvailableServices = async () => {
    try {
      const res = await api.get("/services?available=true");
      setAvailableServices(res.data);
    } catch (error) {
      console.error("Error loading available services:", error);
    }
  };

  const loadParts = async () => {
    try {
      const res = await api.get("/parts");
      setParts(res.data);
    } catch (error) {
      console.error("Error loading parts:", error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (selectedServices.length === 0 && selectedParts.length === 0 && customParts.length === 0) {
      newErrors.services = "Please add at least one service, part, or custom part";
    }

    if (!formData.paid_amount) {
      newErrors.paid_amount = "Paid amount is required";
    } else if (formData.paid_amount < 0) {
      newErrors.paid_amount = "Paid amount cannot be negative";
    } else if (parseFloat(formData.paid_amount) > parseFloat(formData.total_cost)) {
      newErrors.paid_amount = "Paid amount cannot exceed total cost";
    }

    if (!formData.payment_method) {
      newErrors.payment_method = "Payment method is required";
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

  // ----- Service handlers -----
  const handleAddService = (service) => {
    const existingService = selectedServices.find(s => s.service_id === service.service_id);
    if (!existingService) {
      setSelectedServices([
        ...selectedServices,
        {
          service_id: service.service_id,
          problem_name: service.problem_name,
          problem_fee: service.problem_fee || 0,
          plate_number: service.plate_number,
          car_model: service.car_model
        }
      ]);
    } else {
      alert("This service is already added!");
    }
  };

  const handleRemoveService = (index) => {
    setSelectedServices(selectedServices.filter((_, i) => i !== index));
  };

  // ----- Regular part handlers -----
  const handleAddPart = (part) => {
    const existingPart = selectedParts.find(p => p.part_id === part.part_id);
    
    if (existingPart) {
      setSelectedParts(selectedParts.map(p => 
        p.part_id === part.part_id 
          ? { ...p, quantity: p.quantity + 1 }
          : p
      ));
    } else {
      setSelectedParts([
        ...selectedParts,
        {
          part_id: part.part_id,
          part_name: part.part_name,
          quantity: 1,
          price: part.sell_price,
          brand: part.brand
        }
      ]);
    }
  };

  const handleRemovePart = (index) => {
    setSelectedParts(selectedParts.filter((_, i) => i !== index));
  };

  const handlePartQuantityChange = (index, quantity) => {
    const newQuantity = parseInt(quantity) || 1;
    setSelectedParts(selectedParts.map((part, i) => 
      i === index ? { ...part, quantity: newQuantity } : part
    ));
  };

  // ----- Custom part handlers -----
  const handleAddCustomPart = () => {
    if (!newCustomPart.part_name.trim()) {
      alert("Please enter a part name");
      return;
    }
    if (!newCustomPart.price || newCustomPart.price <= 0) {
      alert("Please enter a valid price");
      return;
    }
    if (!newCustomPart.quantity || newCustomPart.quantity < 1) {
      alert("Quantity must be at least 1");
      return;
    }

    setCustomParts([
      ...customParts,
      {
        id: Date.now(), // temporary id
        part_name: newCustomPart.part_name,
        price: parseFloat(newCustomPart.price),
        quantity: parseInt(newCustomPart.quantity)
      }
    ]);
    // reset form
    setNewCustomPart({ part_name: "", price: "", quantity: 1 });
  };

  const handleRemoveCustomPart = (index) => {
    setCustomParts(customParts.filter((_, i) => i !== index));
  };

  const handleCustomPartQuantityChange = (index, quantity) => {
    const newQuantity = parseInt(quantity) || 1;
    setCustomParts(customParts.map((cp, i) =>
      i === index ? { ...cp, quantity: newQuantity } : cp
    ));
  };

  // ----- Save / Update -----
  const handleAdd = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isEdit) {
        // 1. Update invoice basic info
        const invoiceData = {
          total_cost: formData.total_cost,
          paid_amount: formData.paid_amount,
          payment_method: formData.payment_method,
          date: formData.date,
          services: selectedServices,
          parts: selectedParts
        };
        await api.put(`/invoices/${currentId}/full`, invoiceData);

        // 2. Replace custom parts (delete all old, insert new)
        await api.delete(`/custom-parts/invoice/${currentId}`);
        for (const cp of customParts) {
          await api.post("/custom-parts", {
            invoice_id: currentId,
            part_name: cp.part_name,
            price: cp.price,
            quantity: cp.quantity
          });
        }
        alert("✅ Invoice updated successfully!");
      } else {
        // Create new invoice
        const invoiceRes = await api.post("/invoices", {
          total_cost: formData.total_cost,
          paid_amount: formData.paid_amount,
          payment_method: formData.payment_method,
          date: formData.date
        });
        const invoiceId = invoiceRes.data.invoice_id;

        // Save services
        for (const service of selectedServices) {
          await api.post("/invoice-services", {
            invoice_id: invoiceId,
            service_id: service.service_id,
            service_fee: service.problem_fee
          });
        }

        // Save regular parts
        for (const part of selectedParts) {
          await api.post("/invoice-details", {
            invoice_id: invoiceId,
            part_id: part.part_id,
            quantity: part.quantity,
            price: part.price
          });
        }

        // Save custom parts
        for (const cp of customParts) {
          await api.post("/custom-parts", {
            invoice_id: invoiceId,
            part_name: cp.part_name,
            price: cp.price,
            quantity: cp.quantity
          });
        }
        alert("✅ Invoice created successfully!");
      }
      resetForm();
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert(`❌ Failed to ${isEdit ? 'update' : 'create'} invoice`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      total_cost: 0,
      paid_amount: "",
      payment_method: "cash",
      date: new Date().toISOString().split('T')[0]
    });
    setSelectedServices([]);
    setSelectedParts([]);
    setCustomParts([]);
    setNewCustomPart({ part_name: "", price: "", quantity: 1 });
    setShowForm(false);
    setIsEdit(false);
    setCurrentId(null);
    setErrors({});
    loadInvoices();
  };

  const openAddForm = () => {
    setFormData({
      total_cost: 0,
      paid_amount: "",
      payment_method: "cash",
      date: new Date().toISOString().split('T')[0]
    });
    setSelectedServices([]);
    setSelectedParts([]);
    setCustomParts([]);
    setNewCustomPart({ part_name: "", price: "", quantity: 1 });
    setIsEdit(false);
    setShowForm(true);
    setErrors({});
    fetchAvailableServices();
  };

  const loadInvoiceForEdit = async (invoiceId) => {
    try {
      const invoiceRes = await api.get(`/invoices/${invoiceId}`);
      const invoice = invoiceRes.data;

      const servicesRes = await api.get(`/invoice-services/invoice/${invoiceId}`);
      const invoiceServices = servicesRes.data;

      const partsRes = await api.get(`/invoice-details/invoice/${invoiceId}`);
      const invoiceParts = partsRes.data;

      const customPartsRes = await api.get(`/custom-parts/invoice/${invoiceId}`);
      const invoiceCustomParts = customPartsRes.data;

      const selectedServicesData = invoiceServices.map(is => {
        const service = services.find(s => s.service_id === is.service_id);
        return {
          service_id: is.service_id,
          problem_name: service?.problem_name || '',
          problem_fee: is.service_fee || 0,
          plate_number: service?.plate_number || '',
          car_model: service?.car_model || ''
        };
      });

      const selectedPartsData = invoiceParts.map(ip => {
        const part = parts.find(p => p.part_id === ip.part_id);
        return {
          part_id: ip.part_id,
          part_name: part?.part_name || '',
          quantity: ip.quantity,
          price: ip.price,
          brand: part?.brand || ''
        };
      });

      const selectedCustomPartsData = invoiceCustomParts.map(cp => ({
        id: cp.id,
        part_name: cp.part_name,
        price: cp.price,
        quantity: cp.quantity
      }));

      setFormData({
        total_cost: invoice.total_cost,
        paid_amount: invoice.paid_amount,
        payment_method: invoice.payment_method,
        date: invoice.date ? invoice.date.split('T')[0] : new Date().toISOString().split('T')[0]
      });
      setSelectedServices(selectedServicesData);
      setSelectedParts(selectedPartsData);
      setCustomParts(selectedCustomPartsData);
      setCurrentId(invoiceId);
      setIsEdit(true);
      setShowForm(true);
      fetchAvailableServices();
    } catch (error) {
      console.error("Error loading invoice for edit:", error);
      alert("Failed to load invoice data");
    }
  };

  const handleDelete = async (invoiceId) => {
    if (!window.confirm("Are you sure you want to delete this invoice? This will also delete all related services, parts, and custom parts.")) return;
    try {
      await api.delete(`/invoices/${invoiceId}`);
      loadInvoices();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      alert("Failed to delete invoice");
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US').format(price) + ' Ks';
  };

  const getServiceDisplay = (service) => {
    if (!service) return 'Unknown';
    return `${service.plate_number || 'No Plate'} - ${service.problem_name || 'No Problem'} (${formatPrice(service.problem_fee || 0)})`;
  };

  const filteredInvoices = invoices.filter(invoice => {
    const searchLower = searchTerm.toLowerCase();
    const serviceTexts = invoice.services?.map(s => {
      const service = services.find(serv => serv.service_id === s.service_id);
      return service?.problem_name?.toLowerCase() || '';
    }).join(' ') || '';
    
    const partTexts = invoice.parts?.map(p => {
      const part = parts.find(prt => prt.part_id === p.part_id);
      return part?.part_name?.toLowerCase() || '';
    }).join(' ') || '';

    const customPartTexts = invoice.customParts?.map(cp => cp.part_name.toLowerCase()).join(' ') || '';
    
    return (
      invoice.payment_method?.toLowerCase().includes(searchLower) ||
      serviceTexts.includes(searchLower) ||
      partTexts.includes(searchLower) ||
      customPartTexts.includes(searchLower) ||
      invoice.total_cost?.toString().includes(searchTerm)
    );
  });

  const paymentMethods = [
    { value: 'cash', label: '💵 Cash' },
    { value: 'card', label: '💳 Kpay' },
  ];

  const completedAvailableServices = availableServices.filter(s => s.status === 'completed');
  const filteredAvailableServices = completedAvailableServices.filter(
    s => !selectedServices.some(sel => sel.service_id === s.service_id)
  );

  return (
    <div className="invoices-page">
      <div className="header">
        <h2>💰 Invoices</h2>
        <div className="header-right">
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button
            className="add-btn"
            onClick={openAddForm}
            disabled={loading}
          >
            + New Invoice
          </button>
        </div>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="modal-overlay">
          <div className="form-box">
            <h3>{isEdit ? "Edit Invoice" : "Create New Invoice"}</h3>

            {/* Add Services */}
            <div className="form-group">
              <label>Add Services</label>
              <select
                onChange={(e) => {
                  const service = availableServices.find(s => s.service_id === parseInt(e.target.value));
                  if (service) handleAddService(service);
                  e.target.value = '';
                }}
              >
                <option value="">-- Select service to add --</option>
                {filteredAvailableServices.map(service => (
                  <option key={service.service_id} value={service.service_id}>
                    {getServiceDisplay(service)}
                  </option>
                ))}
              </select>
              {errors.services && <span className="error-message">{errors.services}</span>}
            </div>

            {/* Selected Services List */}
            {selectedServices.length > 0 && (
              <div className="services-section">
                <div className="section-header">
                  <h4>Selected Services ({selectedServices.length})</h4>
                  <span className="section-total">
                    Total: {formatPrice(selectedServices.reduce((sum, s) => sum + (parseFloat(s.problem_fee) || 0), 0))}
                  </span>
                </div>
                <div className="items-container">
                  {selectedServices.map((service, index) => (
                    <div key={index} className="service-item">
                      <div className="service-info">
                        <strong>{service.plate_number}</strong>
                        <small>{service.problem_name}</small>
                      </div>
                      <span className="service-fee-display">
                        {formatPrice(service.problem_fee)}
                      </span>
                      <button
                        className="remove-btn"
                        onClick={() => handleRemoveService(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Regular Parts */}
            <div className="form-group">
              <label>Add Parts (from inventory)</label>
              <select
                onChange={(e) => {
                  const part = parts.find(p => p.part_id === parseInt(e.target.value));
                  if (part) handleAddPart(part);
                  e.target.value = '';
                }}
              >
                <option value="">-- Select part to add --</option>
                {parts.map(part => (
                  <option key={part.part_id} value={part.part_id}>
                    {part.part_name} - {part.brand} ({formatPrice(part.sell_price)}) [Stock: {part.stock}]
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Regular Parts */}
            {selectedParts.length > 0 && (
              <div className="parts-section">
                <h4>Selected Parts ({selectedParts.length})</h4>
                <div className="parts-container">
                  {selectedParts.map((part, index) => (
                    <div key={index} className="part-item">
                      <div className="part-info">
                        <strong>{part.part_name}</strong>
                        <small>{part.brand}</small>
                      </div>
                      <input
                        type="number"
                        min="1"
                        className="part-quantity"
                        value={part.quantity}
                        onChange={(e) => handlePartQuantityChange(index, e.target.value)}
                      />
                      <span className="part-total">
                        {formatPrice(part.price * part.quantity)}
                      </span>
                      <button
                        className="remove-btn"
                        onClick={() => handleRemovePart(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <div className="parts-total">
                  <strong>Parts Total: </strong>
                  <span>{formatPrice(selectedParts.reduce((sum, p) => sum + (p.price * p.quantity), 0))}</span>
                </div>
              </div>
            )}

            {/* Add Custom Parts (ad-hoc) */}
            <div className="form-group">
              <label>➕ Add Custom Part (not in inventory)</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Part name"
                  value={newCustomPart.part_name}
                  onChange={(e) => setNewCustomPart({ ...newCustomPart, part_name: e.target.value })}
                  style={{ flex: 2 }}
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={newCustomPart.price}
                  onChange={(e) => setNewCustomPart({ ...newCustomPart, price: e.target.value })}
                  style={{ flex: 1 }}
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={newCustomPart.quantity}
                  onChange={(e) => setNewCustomPart({ ...newCustomPart, quantity: e.target.value })}
                  style={{ width: '70px' }}
                />
                <button type="button" onClick={handleAddCustomPart} className="add-btn-small">Add</button>
              </div>
            </div>

            {/* Selected Custom Parts */}
            {customParts.length > 0 && (
              <div className="parts-section">
                <h4>Custom Parts ({customParts.length})</h4>
                <div className="parts-container">
                  {customParts.map((cp, index) => (
                    <div key={index} className="part-item">
                      <div className="part-info">
                        <strong>{cp.part_name}</strong>
                        <small>Custom part</small>
                      </div>
                      <input
                        type="number"
                        min="1"
                        className="part-quantity"
                        value={cp.quantity}
                        onChange={(e) => handleCustomPartQuantityChange(index, e.target.value)}
                      />
                      <span className="part-total">
                        {formatPrice(cp.price * cp.quantity)}
                      </span>
                      <button className="remove-btn" onClick={() => handleRemoveCustomPart(index)}>Remove</button>
                    </div>
                  ))}
                </div>
                <div className="parts-total">
                  <strong>Custom Parts Total: </strong>
                  <span>{formatPrice(customParts.reduce((sum, cp) => sum + (cp.price * cp.quantity), 0))}</span>
                </div>
              </div>
            )}

            {/* Grand Total */}
            <div className="grand-total">
              <label>Grand Total</label>
              <div className="total-display">
                {formatPrice(formData.total_cost)}
              </div>
            </div>

            {/* Paid Amount */}
            <div className="form-group">
              <label>Paid Amount</label>
              <input
                type="number"
                name="paid_amount"
                placeholder="Enter amount paid"
                value={formData.paid_amount}
                onChange={handleChange}
                min="0"
                step="1000"
                className={errors.paid_amount ? "error-input" : ""}
              />
              {errors.paid_amount && <span className="error-message">{errors.paid_amount}</span>}
            </div>

            {/* Payment Method */}
            <div className="form-group">
              <label>Payment Method</label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
              >
                {paymentMethods.map(method => (
                  <option key={method.value} value={method.value}>{method.label}</option>
                ))}
              </select>
            </div>

            {/* Balance Display */}
            {formData.total_cost > 0 && (
              <div className={`balance-display ${formData.total_cost - formData.paid_amount > 0 ? 'balance-unpaid' : 'balance-paid'}`}>
                <span className="balance-label">Balance: </span>
                <span className="balance-amount">
                  {formatPrice(formData.total_cost - formData.paid_amount)}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="action-buttons">
              <button 
                className="save-btn" 
                onClick={handleAdd} 
                disabled={loading}
              >
                {loading ? '💾 Saving...' : '💾 Save Invoice'}
              </button>
              <button 
                className="cancel-btn" 
                onClick={resetForm} 
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVOICES TABLE */}
      {!showForm && (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Services</th>
                <th>Parts</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Method</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => {
                  const balance = inv.total_cost - inv.paid_amount;
                  
                  const serviceList = inv.services?.map(s => {
                    const service = services.find(serv => serv.service_id === s.service_id);
                    return service?.problem_name?.substring(0, 20) || 'Unknown Service';
                  }).join(', ') || 'No services';
                  
                  // Combine regular parts and custom parts for display
                  const regularPartsList = inv.parts?.map(p => {
                    const part = parts.find(prt => prt.part_id === p.part_id);
                    return `${part?.part_name || 'Unknown Part'} (${p.quantity})`;
                  }) || [];
                  const customPartsList = inv.customParts?.map(cp => `${cp.part_name} (${cp.quantity}) [Custom]`) || [];
                  const partList = [...regularPartsList, ...customPartsList].join(', ') || 'No parts';
                  
                  return (
                    <tr key={inv.invoice_id}>
                      <td>{inv.invoice_id}</td>
                      <td>
                        <div className="service-text">
                          {serviceList}
                        </div>
                      </td>
                      <td>
                        <div className="parts-text">
                          {partList}
                        </div>
                      </td>
                      <td><strong>{formatPrice(inv.total_cost)}</strong></td>
                      <td>{formatPrice(inv.paid_amount)}</td>
                      <td className={balance > 0 ? 'balance-positive' : 'balance-zero'}>
                        {formatPrice(balance)}
                      </td>
                      <td>{inv.payment_method}</td>
                      <td>{new Date(inv.date).toLocaleDateString()}</td>
                      <td className="actions-cell">
                        <button
                          className="edit-btn"
                          onClick={() => loadInvoiceForEdit(inv.invoice_id)}
                          title="Edit invoice"
                        >
                          ✏️
                        </button>
                        <button
                          className="print-btn"
                          onClick={() => navigate(`/invoices/${inv.invoice_id}/print`)}
                          title="Print invoice"
                        >
                          🖨️
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(inv.invoice_id)}
                          title="Delete invoice"
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
                    No invoices found
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

export default Invoices;