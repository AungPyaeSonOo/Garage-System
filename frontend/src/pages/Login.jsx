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
      <h2>Login</h2>

      {errors.general && (
        <div style={{ color: "red" }}>{errors.general}</div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          name="username"
          placeholder="Username"
          onChange={handleChange}
          autoComplete="username"
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          autoComplete="current-password"
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