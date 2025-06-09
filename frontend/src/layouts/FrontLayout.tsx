import {apiClient} from "@/api/client";
import {NavLink, Outlet, useLocation, useNavigate} from "react-router";
import {Input, Popconfirm, message, Avatar, Dropdown, type MenuProps} from "antd";
import {Podcast, LogOut, User, House, ListMusic, BoomBox, AudioWaveform} from "lucide-react";
import {useState} from "react";
import ModeToggle from "@/components/common/ModeToggle.tsx";
import FullscreenToggle from "@/components/common/FullscreenToggle.tsx";
import Feedback from "@/pages/home/Feedback.tsx";
import MusicPlayer from "@/components/common/MusicPlayer.tsx";

const {Search} = Input;

// 导航栏组件
function Navigation() {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchLoading, setSearchLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    // 登录和注册页不显示导航栏
    if (["/login", "/register"].includes(location.pathname)) return null;

    const handleSearch = async (value: string) => {
        if (!value.trim()) return;
        setSearchLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000)); // 模拟请求
            messageApi.info(`搜索关键词：${value}`);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await apiClient.logout();
            ["accessToken", "username", "userRole", "avatar", "email"].forEach((key) =>
                localStorage.removeItem(key)
            );
            messageApi.success("退出成功");
            navigate("/login");
        } catch (err) {
            console.error("Unexpected error:", err);
            messageApi.error("退出失败，请重试");
        }
    };
    const items: MenuProps['items'] = [
        {
            key: 'profile',
            label: '个人信息',
            icon: <User size={18}/>,
            onClick: () => {
                navigate("/user/center")

            }
        },
        {
            key: 'logout',
            label: (
                <Popconfirm
                    title="确认退出登录？"
                    description="退出后将无法继续使用系统。"
                    onConfirm={handleLogout}
                    okText="确定"
                    cancelText="取消"
                >
                    <span style={{display: 'block'}}>退出登录</span>
                </Popconfirm>
            ),
            icon: <LogOut size={18}/>,
        },
    ];
    return (
        <>
            {contextHolder}
            <nav className="bg-white dark:bg-zinc-900 sticky z-10 top-0 left-auto">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center">
                            <Podcast className="h-8 w-8 text-indigo-600 dark:text-indigo-400"/>
                            <span className="ml-2.5 text-lg text-[#000000d9] dark:text-[#ffffffd9]">
                              ZhiYin
                            </span>
                        </div>
                        <div>
                            <ul className="flex items-center space-x-18">
                                <li>
                                    <NavLink
                                        to="/"
                                        className="text-[#000000d9] dark:text-[#ffffffd9] hover:text-indigo-600 dark:hover:text-indigo-400"
                                    >
                                        <div className="flex items-center gap-1"><House
                                            strokeWidth={1.5}/><span>首页</span></div>
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        to="/playlist"
                                        className="text-[#000000d9] dark:text-[#ffffffd9] hover:text-indigo-600 dark:hover:text-indigo-400"
                                    >
                                        <div className="flex items-center gap-1"><ListMusic
                                            strokeWidth={1.5}/><span>歌单</span></div>

                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        to="/recommend"
                                        className="text-[#000000d9] dark:text-[#ffffffd9] hover:text-indigo-600 dark:hover:text-indigo-400"
                                    >
                                        <div className="flex items-center gap-1"><AudioWaveform
                                            strokeWidth={1.5}/><span>推荐</span></div>
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        to="/my"
                                        className="text-[#000000d9] dark:text-[#ffffffd9] hover:text-indigo-600 dark:hover:text-indigo-400"
                                    >
                                        <div className="flex items-center gap-1"><BoomBox
                                            strokeWidth={1.5}/><span>我的音乐</span></div>
                                    </NavLink>
                                </li>
                            </ul>
                        </div>
                        <div className="flex items-center gap-4">

                            <div className="max-w-[300px]">
                                <Search
                                    placeholder="搜索..."
                                    onSearch={handleSearch}
                                    loading={searchLoading}
                                    allowClear
                                    enterButton
                                />
                            </div>

                            <Dropdown menu={{items}} placement="bottomRight" arrow>
                                <Avatar
                                    size="large"
                                    src={localStorage.getItem("avatar")}
                                    icon={<User/>}
                                    style={{cursor: 'pointer'}}
                                    className="hover:shadow-md transition-all"
                                />
                            </Dropdown>
                            <Feedback/>
                            <FullscreenToggle/>
                            <ModeToggle/>

                        </div>
                    </div>
                </div>
            </nav>

        </>
    );
}

export default function FrontLayout() {
    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-[#121212]">
            <Navigation/>
            <main
                className="flex-1 overflow-auto sm:px-6 lg:px-8 text-[#000000d9] dark:text-[#ffffffd9]"
            >
                <Outlet/>
            </main>
            <div >
                <MusicPlayer
                    title="和你"
                    artist="余佳运"
                    cover="http://127.0.0.1:8000/upload/cover/和你.jpg"
                    audioUrl="http://127.0.0.1:8000/upload/source/和你-余佳运.mp3"
                    lyricUrl="http://127.0.0.1:8000/upload/lyric/和你.lrc"
                />
            </div>
        </div>
    );
}
