const express = require("express");
const cors = require("cors");
const pool = require("./db/connection");
const { router: userRoutes, authenticateToken } = require("./routes/userRoutes");

// Import routes (same as yours)
const customerRoutes = require("./routes/customerRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const partRoutes = require("./routes/partRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const invoiceServicesRoutes = require("./routes/invoiceServicesRoutes");
const invoiceDetailsRoutes = require("./routes/invoiceDetailsRoutes");
const salesInvoiceRoutes = require("./routes/salesInvoiceRoutes");
const problemRoutes = require("./routes/problemRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const invoiceCustomPartsRoutes = require("./routes/invoiceCustomParts");

const app = express();

// ✅ ADD YOUR VERCEL FRONTEND URL TO CORS
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://www.mswgarage.shop" ,
    "https://mswgarage.shop"  // <-- your live frontend
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());
app.options("*", cors());

app.get('/ping', (req, res) => res.json({ message: 'Server is alive!' }));

pool.connect((err, client, release) => {
  if (err) console.error('❌ Error connecting to database:', err);
  else { console.log('✅ Connected to PostgreSQL database'); release(); }
});

app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url}`);
  next();
});

// Routes
app.use("/users", userRoutes);
app.use("/customers", authenticateToken, customerRoutes);
app.use("/vehicles", authenticateToken, vehicleRoutes);
app.use("/services", authenticateToken, serviceRoutes);
app.use("/problems", problemRoutes);
app.use("/employees", authenticateToken, employeeRoutes);
app.use("/parts", authenticateToken, partRoutes);
app.use("/invoices", authenticateToken, invoiceRoutes);
app.use("/invoice-services", authenticateToken, invoiceServicesRoutes);
app.use("/invoice-details", authenticateToken, invoiceDetailsRoutes);
app.use("/sales-invoices", authenticateToken, salesInvoiceRoutes);
app.use("/dashboard", authenticateToken, dashboardRoutes);
app.use("/custom-parts", authenticateToken, invoiceCustomPartsRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Auto Service API",
    endpoints: {
      users: "/users (login, register, setup)",
      customers: "/customers",
      vehicles: "/vehicles",
      services: "/services",
      employees: "/employees",
      parts: "/parts",
      invoices: "/invoices",
      customParts: "/custom-parts"
    }
  });
});

// ❌ REMOVE the static frontend block – not needed for separate deployment
// const frontendBuildPath = path.join(__dirname, "../frontend/dist");
// app.use(express.static(frontendBuildPath));
// app.get("*", (req, res) => { ... });

// 404 handler for API only
app.use("*", (req, res) => {
  console.log(`❌ Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));