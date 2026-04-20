// pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import "../styles/auth.css";

function Login({ onLogin }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      // ✅ IMPORTANT: MUST BE POST
      const response = await api.post("/users/login", formData);

      console.log("LOGIN RESPONSE:", response.data);

      // ✅ SAFE ACCESS (prevents undefined crash)
      const token = response?.data?.token;
      const user = response?.data?.user;

      if (!token) {
        throw new Error("Token not received from server");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user || {}));

      if (onLogin) onLogin(user);

      navigate("/");

    } catch (error) {
      console.error("Login error:", error);

      setErrors({
        general:
          error.response?.data?.error ||
          error.message ||
          "Login failed. Please try again."
      });

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-left">
          <div className="auth-overlay">
            <h1>MSW & Brothers</h1>
            <p>Auto Service Management System</p>

            <div className="auth-features">
              <div className="feature">🔧 Service Management</div>
              <div className="feature">💰 Invoice & Payments</div>
              <div className="feature">📊 Reports & Analytics</div>
              <div className="feature">🚗 Vehicle History</div>
            </div>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-form-container">
            <h2>Welcome Back</h2>
            <p className="auth-subtitle">Please login to your account</p>

            {errors.general && (
              <div className="auth-error">{errors.general}</div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">

              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={errors.username ? "error-input" : ""}
                  placeholder="Enter your username"
                  autoComplete="username"
                />
                {errors.username && (
                  <span className="error-message">{errors.username}</span>
                )}
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
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>

                {errors.password && (
                  <span className="error-message">{errors.password}</span>
                )}
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" /> Remember me
                </label>

                <Link to="/forgot-password" className="forgot-link">
                  Forgot Password?
                </Link>
              </div>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;