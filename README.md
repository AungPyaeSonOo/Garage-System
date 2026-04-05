# 🚗 Garage - Auto Workshop Management System

A complete full‑stack web application for managing an auto repair shop – customers, vehicles, services, parts, invoices, and more. Built with React, Node.js, Express, and PostgreSQL.

## ✨ Features

- 🔐 **Authentication** – JWT‑based login & registration.
- 👥 **Customer Management** – Add, edit, delete customers.
- 🚘 **Vehicle Management** – Link vehicles to customers, track plate, model, engine.
- 🔧 **Services & Problems** – Manage service history and problem descriptions.
- 🧰 **Parts Inventory** – Track regular parts (with quantity) and custom parts.
- 📄 **Invoicing** – Create, view, print, and manage invoices (with thermal receipt support).
- 💰 **Payments** – Record partial or full payments, track balance.
- 📊 **Dashboard** – Overview of sales, pending balances, and key metrics.
- 🖨️ **Printable Invoices** – Optimized for 80mm thermal receipt printers.

## 🛠️ Tech Stack

### Frontend
- React 19
- Vite
- React Router v7
- Axios
- React‑To‑Print
- Recharts (dashboard charts)

### Backend
- Node.js
- Express
- PostgreSQL
- JWT (authentication)
- bcryptjs

### DevOps & Hosting
- Git & GitHub
- Render (recommended for deployment)
- Environment variables for secrets

## 📁 Project Structure

Garage/
├── backend/
│ ├── routes/ # API route handlers
│ ├── db/ # Database connection pool
│ ├── server.js # Express entry point
│ └── package.json
├── frontend/
│ ├── src/
│ │ ├── components/ # React components
│ │ ├── pages/ # Page views (Invoices, Customers, etc.)
│ │ ├── utils/ # API client, helpers
│ │ ├── App.jsx
│ │ └── main.jsx
│ ├── public/
│ ├── index.html
│ ├── vite.config.js
│ ├── .env.production
│ └── package.json
├── .gitignore
├── package.json (root) # Orchestrates build & start
└── README.md


## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (local or cloud)
- Git

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/Garage.git
cd Garage

npm run install-all

PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=garage_db
JWT_SECRET=your_super_secret_key

psql -U your_user -d garage_db -f database/schema.sql

npm run dev

npm run build

npm start
