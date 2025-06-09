import {BrowserRouter as Router, Routes, Route, Navigate} from "react-router";
import Login from "@/pages/auth/Login";
import {ConfigProvider, theme} from "antd";
import Register from "@/pages/auth/Register";
import Dashboard from "@/pages/admin/Dashboard";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicRoute from "@/components/PublicRoute";
import AdminLayout from "@/layouts/AdminLayout";
import FrontLayout from "@/layouts/FrontLayout";
import {ThemeProvider, useTheme} from "@/components/common/ThemeProvider.tsx";
import SystemInfo from "@/pages/admin/SystemInfo";
import UserManage from "@/pages/admin/UserManage";
import SongManage from "@/pages/admin/SongManage";
import CategoryManage from "@/pages/admin/CategoryManage";
import LanguageManage from "@/pages/admin/LanguageManage";
import LoginLogManage from "@/pages/admin/LoginLogManage";
import CommentManage from "@/pages/admin/CommentManage";
import AdvertiseManage from "@/pages/admin/AdvertiseManage";
import FeedBackManage from "@/pages/admin/FeedBackManage";
import NoticeManage from "@/pages/admin/NoticeManage";
import PlaylistManage from "@/pages/admin/PlaylistManage.tsx";
import Home from "@/pages/home/Home.tsx";
import Playlist from "@/pages/home/Playlist.tsx";
import MySongs from "@/pages/home/MySongs.tsx";
import UserCenter from "@/pages/home/UserCenter.tsx";
import Recommend from "@/pages/home/Recommend.tsx";

function AppContent() {
    const {theme: currentTheme} = useTheme();

    const getThemeAlgorithm = () => {
        if (currentTheme === "system") {
            return window.matchMedia("(prefers-color-scheme: dark)").matches
                ? theme.darkAlgorithm
                : theme.defaultAlgorithm;
        }
        return currentTheme === "dark"
            ? theme.darkAlgorithm
            : theme.defaultAlgorithm;
    };

    return (
        <ConfigProvider
            theme={{
                algorithm: getThemeAlgorithm(),
                token: {
                    colorPrimary: "#4f46e5",
                },
            }}
        >
            <Router>
                <Routes>
                    {/* 认证相关路由 */}
                    <Route
                        path="/login"
                        element={
                            <PublicRoute>
                                <Login/>
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            <PublicRoute>
                                <Register/>
                            </PublicRoute>
                        }
                    />

                    {/* 后台路由 */}
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute requireAdmin>
                                <AdminLayout/>
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Dashboard/>}/>
                        <Route path="user" element={<UserManage/>}/>
                        <Route path="songs" element={<SongManage/>}/>
                        <Route path="category" element={<CategoryManage/>}/>
                        <Route path="language" element={<LanguageManage/>}/>
                        <Route path="loginLog" element={<LoginLogManage/>}/>
                        <Route path="comment" element={<CommentManage/>}/>
                        <Route path="advertise" element={<AdvertiseManage/>}/>
                        <Route path="feedback" element={<FeedBackManage/>}/>
                        <Route path="systemInfo" element={<SystemInfo/>}/>
                        <Route path="notice" element={<NoticeManage/>}/>
                        <Route path="playlist" element={<PlaylistManage/>}/>
                        <Route path="*" element={<Navigate to="/admin" replace/>}/>
                    </Route>

                    {/* 前台路由 */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <FrontLayout/>
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Home/>}/>
                        <Route path="/playlist" element={<Playlist/>}/>
                        <Route path="/user/center" element={<UserCenter/>}/>
                        <Route path="/my" element={<MySongs/>}/>
                        <Route path="/recommend" element={<Recommend/>}/>
                        <Route path="*" element={<Navigate to="/" replace/>}/>
                    </Route>
                </Routes>
            </Router>
        </ConfigProvider>
    );
}

function App() {
    return (
        <ThemeProvider storageKey="vite-ui-theme">
            <AppContent/>
        </ThemeProvider>
    );
}

export default App;
