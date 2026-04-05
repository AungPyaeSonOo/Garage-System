import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import "../styles/auth.css";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    full_name: "",
    password: "",
    confirm_password: "",
    role: "staff"           // default role: staff
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = "Username is required";
    else if (formData.username.length < 3) newErrors.username = "Username must be at least 3 characters";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
    if (!formData.full_name.trim()) newErrors.full_name = "Full name is required";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirm_password) newErrors.confirm_password = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = { ...formData };
      delete payload.confirm_password;
      console.log("📤 Register payload:", payload);
      const response = await api.post("/users/register", payload);
      console.log("✅ Registration success:", response.data);
      alert(`${payload.role === "admin" ? "Admin" : "Staff"} user created successfully!`);
      navigate("/sales-invoices");
    } catch (error) {
      console.error("❌ Registration error:", error);
      setErrors({ general: error.response?.data?.error || "Registration failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-left">
          <div className="auth-overlay">
            <div className="floating-shapes">
              <div className="shape shape-1"></div>
              <div className="shape shape-2"></div>
              <div className="shape shape-3"></div>
            </div>
            <h1>MSW & Brothers</h1>
            <p>Create User Account</p>
            <div className="auth-features">
              <div className="feature">
                <span>👑</span>
                <span>Admin: Full control</span>
              </div>
              <div className="feature">
                <span>👥</span>
                <span>Staff: Limited access</span>
              </div>
              <div className="feature">
                <span>🔐</span>
                <span>Secure authentication</span>
              </div>
            </div>
          </div>
        </div>
        <div className="auth-right">
          <div className="auth-form-container">
            <h2>Create New User</h2>
            <p className="auth-subtitle">Register an administrator or staff member</p>
            {errors.general && <div className="auth-error">{errors.general}</div>}
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={errors.username ? "error-input" : ""}
                  placeholder="Choose a username"
                />
                {errors.username && <span className="error-message">{errors.username}</span>}
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? "error-input" : ""}
                  placeholder="Enter your email"
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className={errors.full_name ? "error-input" : ""}
                  placeholder="Enter your full name"
                />
                {errors.full_name && <span className="error-message">{errors.full_name}</span>}
              </div>
              <div className="form-group">
                <label>Password</label>
                <div className="password-input">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={errors.password ? "error-input" : ""}
                    placeholder="Create a password"
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <div className="password-input">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className={errors.confirm_password ? "error-input" : ""}
                    placeholder="Confirm your password"
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                {errors.confirm_password && <span className="error-message">{errors.confirm_password}</span>}
              </div>
              <div className="form-group">
                <label>Role</label>
                <select name="role" value={formData.role} onChange={handleChange} className="role-select">
                  <option value="staff">👥 Staff (limited access)</option>
                  <option value="admin">👑 Administrator (full access)</option>
                </select>
                <small className="role-hint">Only one administrator can exist. Staff can be created freely.</small>
              </div>
              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? 'Creating Account...' : 'Register User'}
              </button>
            </form>
            <div className="auth-footer">
              <p><Link to="/">← Back to Dashboard</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;