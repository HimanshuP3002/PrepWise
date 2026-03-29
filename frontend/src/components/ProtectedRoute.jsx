import { Navigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isRestoring } = useAuth();

  if (isRestoring) {
    return <div className="screen-state">Restoring session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/login" />;
  }

  return children;
}
