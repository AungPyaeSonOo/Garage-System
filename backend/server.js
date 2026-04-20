const express = require("express");
const cors = require("cors");
const pool = require("./db/connection");
const { router: userRoutes, authenticateToken } = require("./routes/userRoutes");

// Routes
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

// 🚀 IMPORTANT FOR RAILWAY
app.set("trust proxy", 1);

// ---------------- CORS FIX ----------------
app.use(cors({
  origin: "*",   // 🔥 FIX for Railway + Vercel testing (we can secure later)
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options("*", cors());

// ---------------- BODY PARSER ----------------
app.use(express.json());

// ---------------- DB CHECK ----------------
pool.connect((err, client, release) => {
  if (err) console.error("❌ DB Error:", err);
  else {
    console.log("✅ Connected to PostgreSQL");
    release();
  }
});

// ---------------- LOG REQUEST ----------------
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url}`);
  next();
});

// ---------------- ROUTES ----------------
app.use("/users", userRoutes);
app.use("/problems", problemRoutes);

app.use("/customers", authenticateToken, customerRoutes);
app.use("/vehicles", authenticateToken, vehicleRoutes);
app.use("/services", authenticateToken, serviceRoutes);
app.use("/employees", authenticateToken, employeeRoutes);
app.use("/parts", authenticateToken, partRoutes);
app.use("/invoices", authenticateToken, invoiceRoutes);
app.use("/invoice-services", authenticateToken, invoiceServicesRoutes);
app.use("/invoice-details", authenticateToken, invoiceDetailsRoutes);
app.use("/sales-invoices", authenticateToken, salesInvoiceRoutes);
app.use("/dashboard", authenticateToken, dashboardRoutes);
app.use("/custom-parts", authenticateToken, invoiceCustomPartsRoutes);

// ---------------- TEST ROUTES ----------------
app.get("/", (req, res) => {
  res.json({ message: "Auto Service API is running 🚀" });
});

app.get("/ping", (req, res) => {
  res.json({ message: "Server is alive!" });
});

// ---------------- 404 HANDLER ----------------
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// ---------------- ERROR HANDLER ----------------
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({ error: "Something went wrong!" });
});

// ---------------- START SERVER (RAILWAY FIX) ----------------
const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});