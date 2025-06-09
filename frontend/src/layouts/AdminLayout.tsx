import {Outlet, useLocation, Link} from "react-router";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {PanelLeftClose, PanelLeftOpen} from "lucide-react";
import {useState} from "react";
import {Breadcrumb} from "antd";
import AdminTabs from "@/components/admin/adminTabs";
import ModeToggle from "@/components/common/ModeToggle.tsx";
import FullscreenToggle from "@/components/common/FullscreenToggle.tsx";

export default function AdminLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();

    // 将路径切分为数组，生成面包屑
    const pathSnippets = location.pathname
        .split("/")
        .filter((i) => i && i !== "admin");

    const breadcrumbItems = [
        {
            title: <Link to="/admin/dashboard">仪表盘</Link>,
        },
        ...pathSnippets.map((_, index) => {
            const titleMap: Record<string, string> = {
                dashboard: "仪表盘",
                user: "用户管理",
                songs: "歌曲管理",
                playlist: "歌单管理",
                category: "分类管理",
                language: "语言管理",
                comment: "评论管理",
                advertise: "广告管理",
                loginLog: "登录日志",
                notice: "通知管理",
                feedback: "反馈管理",
                systemInfo: "系统信息",
            };

            const key = pathSnippets[index];
            return {
                title: titleMap[key] || key,
            };
        }),
    ];

    return (
        <div className="h-screen flex bg-gray-100 dark:bg-[#121212]">
            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 pt-2.5 bg-white dark:bg-[#141414] h-screen overflow-y-auto no-scrollbar transition-[width] duration-300 border-r border-[#d9d9d9]/50 dark:border-[#434343]/50 ${
                    collapsed ? "w-[80px]" : "w-[256px]"
                }`}
            >
                <AdminSidebar collapsed={collapsed}/>
            </aside>

            {/* Main content */}
            <main
                className={` overflow-auto no-scrollbar flex-1 flex flex-col ${collapsed ? 'ml-[80px]' : 'ml-[256px]'} transition-[margin] duration-300`}>
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white dark:bg-[#141414]">
                    <div className="h-16 px-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                className="cursor-pointer"
                                onClick={() => setCollapsed(!collapsed)}
                            >
                                {collapsed ? (
                                    <PanelLeftOpen className="h-5 w-5 text-[#000000d9] dark:text-[#ffffffd9]"/>
                                ) : (
                                    <PanelLeftClose className="h-5 w-5 text-[#000000d9] dark:text-[#ffffffd9]"/>
                                )}
                            </button>
                            {/* 自定义分割线样式 */}
                            <div className="w-px h-5 bg-[#d9d9d9] dark:bg-[#434343]"/>
                            <Breadcrumb items={breadcrumbItems}/>
                        </div>
                        <div className="flex items-center gap-3.5">
                            <FullscreenToggle/>
                            <ModeToggle/>
                        </div>
                    </div>
                    <AdminTabs/>
                </div>
                {/* Scrollable Content */}
                <div className="flex-1">
                    <div className="h-full p-6 ">
                        <Outlet/>
                    </div>
                </div>
            </main>
        </div>
    );
}
