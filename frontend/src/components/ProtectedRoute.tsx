// 保护路由 ==> 如果未登录跳转登录页，已登录按照角色跳转路由

import { Navigate, useLocation } from "react-router";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;  // 添加可选参数，表示是否需要管理员权限
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const isAuthenticated = !!localStorage.getItem("accessToken");
  const userRole = localStorage.getItem("userRole");
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 只有在需要管理员权限且不是管理员时才重定向
  if (requireAdmin && userRole !== "0") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
