import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, user, requiredRole }) {
  // ❌ Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ❌ Role check (if required)
  if (requiredRole) {
    const allowed = Array.isArray(requiredRole)
      ? requiredRole.includes(user.role)
      : user.role === requiredRole;

    if (!allowed) {
      return <Navigate to="/" replace />;
    }
  }

  // ✅ allow admin/staff normally
  return children;
}

export default ProtectedRoute;