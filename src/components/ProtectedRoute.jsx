import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

const ProtectedRoute = ({ role, children }) => {
  if (!isAuthenticated(role)) {
    return <Navigate to="/signIn" replace />;
  }
  return children;
};

export default ProtectedRoute;
