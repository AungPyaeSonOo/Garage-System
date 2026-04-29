import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "../styles/login.css";

function Login({ onLogin }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const res = await api.post("/users/login", formData);

      const { accessToken, refreshToken, user } = res.data;

      if (!accessToken || !refreshToken || !user) {
        setErrors({ general: "Invalid login response from server" });
        setLoading(false);
        return;
      }

      // ✅ SAVE SESSION
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

      onLogin(user);

      // ✅ NO FULL RELOAD
      navigate("/");

    } catch (err) {
      setErrors({
        general: err.response?.data?.error || "Login failed"
      });
    }

    setLoading(false);
  };

  
  return (
    <div className="auth-page">
  
      <div className="auth-container">
  
        {/* LEFT SIDE */}
        <div className="auth-left">
          <div className="auth-overlay">
  
            <h1>MSW & Brothers</h1>
            <p>Auto Service Management System</p>
  
            <div className="auth-features">
  
              <div className="feature">
                <span>🔧</span> Service Management
              </div>
  
              <div className="feature">
                <span>💰</span> Invoice & Payments
              </div>
  
              <div className="feature">
                <span>📊</span> Reports & Analytics
              </div>
  
              <div className="feature">
                <span>🚗</span> Vehicle History
              </div>
  
            </div>
  
          </div>
        </div>
  
        {/* RIGHT SIDE */}
        <div className="auth-right">
  
          <div className="auth-form-container">
  
            <h2>Welcome Back</h2>
            <p className="auth-subtitle">Please login to your account</p>
  
            {errors.general && (
              <div className="auth-error">{errors.general}</div>
            )}
  
            <form onSubmit={handleSubmit} className="auth-form">
  
              {/* USERNAME */}
              <div className="form-group">
                <label>Username</label>
                <input
                  name="username"
                  placeholder="Enter username"
                  onChange={handleChange}
                />
              </div>
  
              {/* PASSWORD */}
              <div className="form-group">
                <label>Password</label>
                <div className="password-input">
                  <input
                    name="password"
                    type="password"
                    placeholder="Enter password"
                    onChange={handleChange}
                  />
                  <button type="button" className="password-toggle">
                    👁️
                  </button>
                </div>
              </div>
  
              {/* OPTIONS */}
              <div className="form-options">
                <label>
                  <input type="checkbox" /> Remember me
                </label>
  
                <a href="#" className="forgot-link">
                  Forgot Password?
                </a>
              </div>
  
              {/* BUTTON */}
              <button className="auth-btn" disabled={loading}>
                {loading ? "Logging..." : "Login"}
              </button>
  
            </form>
  
          </div>
        </div>
  
      </div>
    </div>
  );
}

export default Login;