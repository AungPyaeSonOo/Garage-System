import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const validateForm = () => {
    const err = {};
    if (!formData.username) err.username = "Username required";
    if (!formData.password) err.password = "Password required";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await api.post("/users/login", formData);

      console.log("LOGIN RESPONSE:", res.data);

      const token = res.data?.token;
      const user = res.data?.user || res.data?.data?.user;

      if (!token || !user) {
        throw new Error("Invalid login response");
      }

      // save session
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      onLogin(user);

      // 🔥 FIX: force reload for stable auth state
      window.location.href = "/";

    } catch (err) {
      console.log(err);

      setErrors({
        general:
          err.response?.data?.error ||
          err.message ||
          "Login failed"
      });

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit}>

        <h2>Login</h2>

        {errors.general && <p>{errors.general}</p>}

        <input
          name="username"
          placeholder="Username"
          onChange={handleChange}
        />
        {errors.username && <p>{errors.username}</p>}

        <input
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Password"
          onChange={handleChange}
        />
        {errors.password && <p>{errors.password}</p>}

        <button type="button" onClick={() => setShowPassword(!showPassword)}>
          Show/Hide
        </button>

        <button disabled={loading}>
          {loading ? "Loading..." : "Login"}
        </button>

      </form>
    </div>
  );
}

export default Login;