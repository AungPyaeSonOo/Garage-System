import { useState } from "react";
import api from "../utils/api";
import "../styles/auth.css";

function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username) newErrors.username = "Username required";
    if (!formData.password) newErrors.password = "Password required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await api.post("/users/login", formData);

      console.log("LOGIN SUCCESS:", res.data);

      const token = res.data.token;
      const user = res.data.user;

      if (!token || !user) {
        throw new Error("Invalid server response");
      }

      // ✅ SAVE
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // ✅ UPDATE STATE
      onLogin(user);

      // ✅ HARD REDIRECT (VERY IMPORTANT)
      window.location.href = "/";

    } catch (err) {
      console.log("LOGIN ERROR:", err);

      setErrors({
        general:
          err.response?.data?.error ||
          "Invalid username or password"
      });
    }

    setLoading(false);
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

            {errors.general && <div className="auth-error">{errors.general}</div>}

            <form onSubmit={handleSubmit}>

              <input
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
              />
              {errors.username && <p>{errors.username}</p>}

              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <p>{errors.password}</p>}

              <button disabled={loading}>
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