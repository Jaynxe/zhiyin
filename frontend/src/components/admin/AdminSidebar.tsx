import {
    Users,
    Music,
    Tag,
    Globe,
    History,
    MessageSquare,
    Megaphone,
    MessageCircle,
    Settings,
    Bell,
    AudioLines,
    LogOut,
    User,
    ChevronsUpDown, CircleGauge, ListMusic,
} from "lucide-react";
import {type MenuProps, Modal} from "antd";
import {Menu, Avatar, Dropdown, message} from "antd";
import {useNavigate, useLocation} from "react-router";
import {apiClient} from "@/api/client";

type MenuItem = Required<MenuProps>["items"][number];

const iconStyle = {
    width: "18px",
    height: "18px",
    strokeWidth: "1.5",
    color: "currentColor",
};

const menuItems: MenuItem[] = [
    {
        key: "logo",
        icon: (
            <AudioLines strokeWidth={1.5} size={32}/>
        ),
        label: <span
            className="text-xl tracking-wide">MusicAdmin</span>,
    },
    {
        type: "group",
        label: "内容管理",
        children: [
            {
                key: "dashboard",
                icon: <CircleGauge style={iconStyle}/>,
                label: "仪表盘",
            },
            {
                key: "user",
                icon: <Users style={iconStyle}/>,
                label: "用户管理",
            },
            {
                key: "songs",
                icon: <Music style={iconStyle}/>,
                label: "歌曲管理",
            },
            {
                key: "playlist",
                icon: <ListMusic style={iconStyle}/>,
                label: "歌单管理",
            },
            {
                key: "category",
                icon: <Tag style={iconStyle}/>,
                label: "分类管理",
            },
            {
                key: "language",
                icon: <Globe style={iconStyle}/>,
                label: "语言管理",
            },
            {
                key: "comment",
                icon: <MessageSquare style={iconStyle}/>,
                label: "评论管理",
            },
            {
                key: "advertise",
                icon: <Megaphone style={iconStyle}/>,
                label: "广告管理",
            },
        ],
    },
    {
        type: "group",
        label: "系统管理",
        children: [
            {
                key: "loginLog",
                icon: <History style={iconStyle}/>,
                label: "登录日志",
            },
            {
                key: "notice",
                icon: <Bell style={iconStyle}/>,
                label: "通知管理",
            },
            {
                key: "feedback",
                icon: <MessageCircle style={iconStyle}/>,
                label: "反馈管理",
            },
            {
                key: "systemInfo",
                icon: <Settings style={iconStyle}/>,
                label: "系统信息",
            },
        ],
    },
];

export default function AdminSidebar({collapsed}: { collapsed: boolean }) {
    const [messageApi, contextHolder] = message.useMessage();
    const [modal, modalContextHolder] = Modal.useModal();
    const navigate = useNavigate();
    const location = useLocation();
    const avatar = localStorage.getItem("avatar");
    const username = localStorage.getItem("username");
    const email = localStorage.getItem("email");

    const getSelectedKey = () => {
        const path = location.pathname;
        if (path === "/admin" || path === "/admin/") {
            return "dashboard";
        }
        return path.split("/").pop() || "dashboard";
    };

    const onClick: MenuProps["onClick"] = (e) => {
        if (e.key !== "logo") {
            navigate(`/admin/${e.key}`);
        }
    };

    const handleLogout = async () => {
        try {
            await apiClient.logout();
            ["accessToken", "username", "userRole", "avatar", "email"].forEach(
                (key) => localStorage.removeItem(key)
            );
            messageApi.success("退出成功");
            navigate("/login");
        } catch (err) {
            console.error("Unexpected error:", err);
            messageApi.error("退出失败，请重试");
        }
    };

    const userMenuItems: MenuProps["items"] = [
        {
            key: "profile",
            icon: <User style={iconStyle}/>,
            label: "个人信息",
            onClick: () => {
                navigate("/user/profile");
            }
        },
        {
            key: "logout",
            icon: <LogOut style={iconStyle}/>,
            label: "退出登录",
            onClick: () => {
                modal.confirm({
                    title: "退出登录",
                    content: "确定要退出登录吗?",
                    okText: "确定",
                    cancelText: "取消",
                    onOk: () => handleLogout(),
                });
            },
        },
    ];


    return (
        <>
            {contextHolder}
            {modalContextHolder}
            <div className="flex flex-col h-full"> {/* 关键：让容器高度占满父级 */}
                <div className="flex-1">
                    <Menu
                        onClick={onClick}
                        selectedKeys={[getSelectedKey()]}
                        mode="inline"
                        items={menuItems}
                        inlineCollapsed={collapsed}
                        style={{borderRight: "none"}} // 去除右边框
                    />
                </div>

                {/* 将 margin-top 设为 auto，让 Dropdown 始终在底部 */}
                <div className="mt-auto">
                    <Dropdown
                        menu={{items: userMenuItems}}
                        trigger={["click"]}
                        placement="topLeft"
                        arrow={{pointAtCenter: true}}
                    >
                        <div className="p-2">
                            <div
                                className="flex items-center justify-center gap-3 rounded-lg transition-all duration-300 cursor-pointer hover:bg-[#f5f5f5] dark:hover:bg-[#1f1f1f] p-2">
                                <Avatar size={collapsed ? 32 : 40} src={avatar}/>
                                {!collapsed && (
                                    <div className="flex-1 min-w-0 flex items-center justify-between">
                                        <div>
                                            <div
                                                className="text-sm font-medium text-[#000000d9] dark:text-[#ffffffd9] truncate">
                                                {username}
                                            </div>
                                            <div className="text-xs text-[#00000073] dark:text-[#ffffff73] truncate">
                                                {email}
                                            </div>
                                        </div>
                                        <ChevronsUpDown className="h-4 w-4 text-[#00000073] dark:text-[#ffffff73]"/>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Dropdown>
                </div>
            </div>
        </>

    );
}
