// pages/PrintInvoice.jsx
import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../utils/api";
import { useReactToPrint } from "react-to-print";
import "../styles/print-invoice.css";

function PrintInvoice() {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [services, setServices] = useState([]);
  const [regularParts, setRegularParts] = useState([]);   // from invoice_details
  const [customParts, setCustomParts] = useState([]);     // from invoice_custom_parts
  const [vehicle, setVehicle] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const componentRef = useRef();

  // ✅ FIXED for react-to-print v3
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Invoice-${invoiceId}`,
  });

  useEffect(() => {
    loadInvoiceData();
  }, [invoiceId]);

  const loadInvoiceData = async () => {
    setLoading(true);
    try {
      // 1. Load invoice basic info
      const invoiceRes = await api.get(`/invoices/${invoiceId}`);
      const invoiceData = invoiceRes.data;
      setInvoice(invoiceData);

      // 2. Load services (already includes problem_name from backend join)
      const servicesRes = await api.get(`/invoice-services/invoice/${invoiceId}`);
      const servicesData = servicesRes.data;
      setServices(servicesData);

      // 3. Load regular parts (from inventory)
      const partsRes = await api.get(`/invoice-details/invoice/${invoiceId}`);
      const partsData = partsRes.data;
      const regularPartsWithDetails = await Promise.all(
        partsData.map(async (p) => {
          try {
            const partDetailRes = await api.get(`/parts/${p.part_id}`);
            return {
              ...p,
              part_name: partDetailRes.data.part_name,
              brand: partDetailRes.data.brand,
              type: "regular"   // marker for display
            };
          } catch {
            return { ...p, part_name: "Unknown Part", brand: "-", type: "regular" };
          }
        })
      );
      setRegularParts(regularPartsWithDetails);

      // 4. Load custom parts (ad-hoc, not in inventory)
      const customPartsRes = await api.get(`/custom-parts/invoice/${invoiceId}`);
      const customPartsData = customPartsRes.data.map(cp => ({
        ...cp,
        part_name: cp.part_name,
        brand: "Custom",
        type: "custom"
      }));
      setCustomParts(customPartsData);

      // 5. Get vehicle and customer info (using first service if exists)
      if (servicesData.length > 0) {
        const firstService = servicesData[0];
        const serviceDetailRes = await api.get(`/services/${firstService.service_id}`);
        const serviceDetail = serviceDetailRes.data;
        if (serviceDetail.vehicle_id) {
          const vehicleRes = await api.get(`/vehicles/${serviceDetail.vehicle_id}`);
          setVehicle(vehicleRes.data);
          if (vehicleRes.data.customer_id) {
            const customerRes = await api.get(`/customers/${vehicleRes.data.customer_id}`);
            setCustomer(customerRes.data);
          }
        }
      }
    } catch (error) {
      console.error("Error loading invoice:", error);
      setError("Failed to load invoice");
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
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading invoice...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="error-message">
        <p>{error || "Invoice not found"}</p>
        <Link to="/invoices">Back to Invoices</Link>
      </div>
    );
  }

  const balance = invoice.total_cost - invoice.paid_amount;
  const servicesTotal = services.reduce((sum, s) => sum + (parseFloat(s.service_fee) || 0), 0);
  const regularPartsTotal = regularParts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const customPartsTotal = customParts.reduce((sum, cp) => sum + (cp.price * cp.quantity), 0);
  const partsTotal = regularPartsTotal + customPartsTotal;

  // Combine regular and custom parts for display, with custom parts shown last
  const allParts = [...regularParts, ...customParts];

  return (
    <div className="print-invoice-page">
      {/* Action Buttons */}
      <div className="print-actions">
        <Link to="/invoices" className="back-btn">← Back to Invoices</Link>
        <button onClick={handlePrint} className="print-btn">
          🖨️ Print / Save PDF
        </button>
      </div>

      {/* Invoice Content - This will be printed */}
      <div className="invoice-paper" ref={componentRef}>
        {/* Header */}
        <div className="invoice-header">
          <div className="company-info">
            <h1>MSW & Brothers</h1>
            <p>Myan Thar 22 Street, Magway</p>
            <p>Tel: 09 984 169 377</p>
            <p>Email: info@msw.com</p>
          </div>
          <div className="invoice-title">
            <h2>INVOICE</h2>
            <div className="invoice-number">{invoice.invoice_id}</div>
          </div>
        </div>

        {/* Invoice Info */}
        <div className="invoice-info">
          <div className="info-row">
            <div className="info-group">
              <label>Invoice Date:</label>
              <span>{formatDate(invoice.date)}</span>
            </div>
            <div className="info-group">
              <label>Payment Method:</label>
              <span className="payment-method">{invoice.payment_method}</span>
            </div>
          </div>
          <div className="info-row">
            <div className="info-group">
              <label>Due Date:</label>
              <span>{formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}</span>
            </div>
            <div className="info-group">
              <label>Status:</label>
              <span className={`status ${balance <= 0 ? 'paid' : 'unpaid'}`}>
                {balance <= 0 ? 'PAID' : 'UNPAID'}
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Vehicle Info – Side by Side */}
        {(customer || vehicle) && (
          <div className="customer-vehicle-row">
            {customer && (
              <div className="customer-column">
                <h3>Bill To:</h3>
                <p><strong>{customer.name}</strong></p>
                <p>Phone: {customer.phone}</p>
                <p>Address: {customer.address}</p>
              </div>
            )}
            {vehicle && (
              <div className="vehicle-column">
                <h3>Vehicle</h3>
                <p><strong>Plate:</strong> {vehicle.plate_number}</p>
                <p><strong>Model:</strong> {vehicle.car_model} ({vehicle.year})</p>
                <p><strong>Engine:</strong> {vehicle.engine_number}</p>
              </div>
            )}
          </div>
        )}

        {/* Services Table */}
        {services.length > 0 && (
          <div className="services-section">
            <h3>Services</h3>
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th className="amount">Fee</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service, index) => (
                  <tr key={index}>
                    <td>{service.problem_name || `Service #${service.service_id}`}</td>
                    <td className="amount">{formatPrice(service.service_fee)}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td><strong>Services Total</strong></td>
                  <td className="amount"><strong>{formatPrice(servicesTotal)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Parts Table (regular + custom) */}
        {allParts.length > 0 && (
          <div className="parts-section">
            <h3>Parts</h3>
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Part Name</th>
                  <th>Brand / Type</th>
                  <th className="center">Qty</th>
                  <th className="amount">Unit Price</th>
                  <th className="amount">Total</th>
                </tr>
              </thead>
              <tbody>
                {allParts.map((part, idx) => (
                  <tr key={idx}>
                    <td>{part.part_name}</td>
                    <td>
                      {part.type === "custom" ? "Custom Part" : (part.brand || "-")}
                    </td>
                    <td className="center">{part.quantity}</td>
                    <td className="amount">{formatPrice(part.price)}</td>
                    <td className="amount">{formatPrice(part.price * part.quantity)}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td colSpan="4"><strong>Parts Total</strong></td>
                  <td className="amount"><strong>{formatPrice(partsTotal)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        <div className="invoice-summary">
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>{formatPrice(invoice.total_cost)}</span>
          </div>
          <div className="summary-row">
            <span>Paid Amount:</span>
            <span>{formatPrice(invoice.paid_amount)}</span>
          </div>
          <div className="summary-row total">
            <span>Balance Due:</span>
            <span className={balance > 0 ? 'balance-due' : 'paid'}>
              {formatPrice(balance)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="invoice-footer">
          <p>Thank you for your business!</p>
          <p className="terms">Terms: Payment due within 7 days</p>
        </div>
      </div>
    </div>
  );
}

export default PrintInvoice;