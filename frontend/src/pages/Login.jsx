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

      if (!token || !user) {
        throw new Error("Invalid login response");
      }

      // save session
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (onLogin) onLogin(user);

      // IMPORTANT FIX
      navigate("/", { replace: true });

    } catch (error) {
      console.error("Login error:", error);

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

        <div className="auth-left">
          <div className="auth-overlay">
            <h1>MSW & Brothers</h1>
            <p>Auto Service System</p>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-form-container">

            <h2>Login</h2>

            {errors.general && (
              <div className="auth-error">{errors.general}</div>
            )}

            <form onSubmit={handleSubmit}>

              <input
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
              />
              {errors.username && <p>{errors.username}</p>}

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <p>{errors.password}</p>}

              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                Toggle
              </button>

              <button disabled={loading}>
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