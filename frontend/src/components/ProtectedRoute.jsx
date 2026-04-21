import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, user, requiredRole }) {
  const token = localStorage.getItem("token");

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const allowed = Array.isArray(requiredRole)
      ? requiredRole.includes(user.role)
      : user.role === requiredRole;

    if (!allowed) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;