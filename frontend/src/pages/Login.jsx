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

    try {
      const res = await api.post("/users/login", formData);

      const accessToken = res.data?.accessToken;
      const refreshToken = res.data?.refreshToken;
      const user = res.data?.user;

      // ✅ FIXED VALIDATION
      if (!accessToken || !refreshToken || !user) {
        setErrors({ general: "Invalid login response from server" });
        return;
      }

      // ✅ SAVE SESSION
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

      onLogin(user);

      window.location.href = "/";

    } catch (err) {
      setErrors({
        general:
          err.response?.data?.error ||
          "Login failed"
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