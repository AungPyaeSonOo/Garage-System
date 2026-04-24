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

      // ✅ NEW (IMPORTANT CHANGE)
      const accessToken = res.data?.accessToken;
      const refreshToken = res.data?.refreshToken;
      const user = res.data?.user;

      if (!accessToken || !refreshToken || !user) {
        console.error("❌ INVALID RESPONSE:", res.data);
        setErrors({ general: "Server returned invalid login data" });
        return;
      }

      // ✅ SAVE TOKENS CORRECTLY
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

      console.log("✅ TOKENS SAVED");

      // optional callback
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