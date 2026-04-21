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
      const response = await api.post("/users/login", formData);

      const token = response?.data?.token;
      const user = response?.data?.user;

      if (!token) throw new Error("Token not received");

      // ✅ save auth
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // sync app
      if (onLogin) onLogin(user);
      window.dispatchEvent(new Event("storage"));

      navigate("/");

    } catch (error) {
      setErrors({
        general:
          error.response?.data?.error ||
          error.message ||
          "Login failed"
      });

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">

        <div className="auth-right">
          <div className="auth-form-container">

            <h2>Welcome Back</h2>

            {errors.general && (
              <div className="auth-error">{errors.general}</div>
            )}

            <form onSubmit={handleSubmit}>

              <input
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Username"
              />
              {errors.username && <p>{errors.username}</p>}

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
              />
              {errors.password && <p>{errors.password}</p>}

              <button type="submit" disabled={loading}>
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