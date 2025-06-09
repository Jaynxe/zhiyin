import {Lock, LogIn, Mail} from "lucide-react";
import {useState} from "react";
import {Link, useNavigate} from "react-router";
import {apiClient} from "@/api/client";
import {isAxiosError} from "axios";
import {Button, Form, Input, Card, message} from "antd";
import {fullImagePath} from "@/utils/common";
import ModeToggle from "@/components/common/ModeToggle.tsx";

// 用户名验证规则
const usernameRules = [
    {required: true, message: "请输入用户名"},
    {min: 2, max: 20, message: "用户名长度必须在2-20个字符之间"},
    {
        pattern: /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/,
        message: "用户名只能包含汉字、字母、数字和下划线",
    },
];

// 密码验证规则
const passwordRules = [
    {required: true, message: "请输入密码"},
    {min: 8, max: 20, message: "密码长度必须在8-20个字符之间"},
    {
        pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/,
        message: "密码必须包含字母和数字",
    },
];

function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    const onFinish = async (values: { username: string; password: string }) => {
        setLoading(true);

        try {
            const {data} = await apiClient.login(values);
            // 登录成功，保存信息
            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("username", data.userInfo.username);
            localStorage.setItem("userRole", data.userInfo.role);
            localStorage.setItem("avatar", fullImagePath(data.userInfo.avatar));
            localStorage.setItem("email", data.userInfo.email);

            apiClient.instance.defaults.headers.common[
                "Authorization"
                ] = `Bearer ${data.accessToken}`;

            messageApi.success("登录成功");

            // 获取重定向路径
            const redirectPath =
                localStorage.getItem("redirectPath") ||
                (data.userInfo.role === "0" ? "/admin" : "/");

            // 清除重定向路径
            localStorage.removeItem("redirectPath");

            setTimeout(() => {
                navigate(redirectPath);
            }, 800);
        } catch (err) {
            if (isAxiosError(err)) {
                const msg = err.response?.data?.msg || "登录失败，请重试";
                messageApi.warning(msg);
            } else {
                console.error("Unexpected error:", err);
                messageApi.error("系统错误，请稍后再试");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {contextHolder}
            <div
                className="relative min-h-screen bg-gray-50 dark:bg-[#121212] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="absolute top-4 right-6"><ModeToggle/></div>

                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="flex justify-center">
                        <LogIn className="h-12 w-12 text-indigo-600"/>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-300">
                        登录账号
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        还没有账号？{" "}
                        <Link
                            to="/register"
                            className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                        >
                            立即注册
                        </Link>
                    </p>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <Card>
                        <Form
                            layout="vertical"
                            onFinish={onFinish}
                            validateTrigger={["onBlur", "onChange"]}
                        >
                            <Form.Item
                                label="用户名"
                                name="username"
                                rules={usernameRules}
                                validateFirst
                            >
                                <Input
                                    prefix={<Mail className="text-gray-400" size={16}/>}
                                    placeholder="请输入用户名"
                                    maxLength={20}
                                />
                            </Form.Item>

                            <Form.Item
                                label="密码"
                                name="password"
                                rules={passwordRules}
                                validateFirst
                            >
                                <Input.Password
                                    prefix={<Lock className="text-gray-400" size={16}/>}
                                    placeholder="请输入密码"
                                    maxLength={20}
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    block
                                >
                                    登录
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </div>
            </div>
        </>
    );
}

export default Login;
