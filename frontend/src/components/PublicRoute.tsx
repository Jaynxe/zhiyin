
// 保护路由 ==> 如果已经登陆就不能再去登录页

import { Navigate } from 'react-router';

interface PublicRouteProps {
    children: React.ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
    const isAuthenticated = !!localStorage.getItem('accessToken');
    const userRole = localStorage.getItem('userRole');

    if (isAuthenticated) {
        // 如果已登录，根据角色重定向
        return <Navigate to={userRole === '0' ? '/admin' : '/'} replace />;
    }

    return <>{children}</>;
} 