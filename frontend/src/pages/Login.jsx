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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    console.log("📤 LOGIN REQUEST:", formData);

    try {
      const res = await api.post("/users/login", formData);

      console.log("📥 LOGIN RESPONSE:", res.data);

      const token = res.data?.token;
      const user = res.data?.user;

      if (!token || !user) {
        console.error("❌ INVALID RESPONSE:", res.data);
        setErrors({ general: "Server returned invalid login data" });
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      onLogin(user);

      console.log("🚀 GO DASHBOARD");

      window.location.href = "/";

    } catch (err) {
      console.log("❌ LOGIN ERROR FULL:", err);

      setErrors({
        general:
          err.response?.data?.error ||
          err.message ||
          "Network error (check backend)"
      });
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <h2>Login</h2>

      {errors.general && (
        <div style={{ color: "red" }}>{errors.general}</div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          name="username"
          placeholder="Username"
          onChange={handleChange}
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          onChange={handleChange}
        />

        <button disabled={loading}>
          {loading ? "Logging..." : "Login"}
        </button>
      </form>
    </div>
  );
}

export default Login;