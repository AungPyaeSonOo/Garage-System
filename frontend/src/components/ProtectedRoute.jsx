import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, user, requiredRole }) {

  // 🔥 IMPORTANT: wait for session restore
  if (user === undefined) {
    return <div className="loading-spinner">Loading...</div>;
  }

  // ❌ not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 🔐 role check
  if (requiredRole) {
    const allowed = Array.isArray(requiredRole)
      ? requiredRole.includes(user.role)
      : user.role === requiredRole;

    if (!allowed) {
      return <Navigate to="/" replace />;
    }
  }

  // ✅ OK
  return children;
}

export default ProtectedRoute;