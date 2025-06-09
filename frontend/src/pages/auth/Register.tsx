import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Form, Input, Button, message, Card } from 'antd';
import { UserPlus, Lock, User } from 'lucide-react';
import { apiClient } from '@/api/client';
import ModeToggle from "@/components/common/ModeToggle.tsx";

interface registerForm {
    username: string;
    password: string;
    repassword: string
}
// 用户名验证规则
const usernameRules = [
    { required: true, message: "请输入用户名" },
    { min: 2, max: 20, message: "用户名长度必须在2-20个字符之间" },
    {
        pattern: /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/,
        message: "用户名只能包含汉字、字母、数字和下划线"
    }
];

// 密码验证规则
const passwordRules = [
    { required: true, message: "请输入密码" },
    { min: 8, max: 20, message: "密码长度必须在8-20个字符之间" },
    {
        pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/,
        message: "密码必须包含字母和数字"
    }
];
function Register() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage(); // 推荐用法
    const onFinish = async (values: registerForm) => {
        const { username, password, repassword } = values;

        if (password !== repassword) {
            messageApi.warning('两次密码输入不一致');
            return;
        }

        setLoading(true);
        try {
            await apiClient.register({ username, password, repassword });
            messageApi.success('注册成功，请登录');
            navigate('/login');
        } catch (err) {
            console.error('注册失败:', err);
            messageApi.error('注册失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {contextHolder}
            <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4 space-y-4">
                <div className="absolute top-4 right-6"><ModeToggle/></div>
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="flex justify-center">
                        <UserPlus className="h-12 w-12 text-indigo-600"/>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        注册账号
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        已有账号？{' '}
                        <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                            立即登录
                        </Link>
                    </p>
                </div>

                <Card className="w-full max-w-md">
                    <Form layout="vertical" onFinish={onFinish} validateTrigger={['onBlur', 'onChange']}
                          autoComplete="off">
                        <Form.Item
                            label="用户名"
                            name="username"
                            rules={usernameRules}
                            validateFirst
                        >
                            <Input
                                prefix={<User size={16} className="text-gray-400"/>}
                                placeholder="请输入用户名"
                            />
                        </Form.Item>

                        <Form.Item
                            label="密码"
                            name="password"
                            rules={passwordRules}
                            validateFirst
                        >
                            <Input.Password
                                prefix={<Lock size={16} className="text-gray-400"/>}
                                placeholder="请输入密码"
                            />
                        </Form.Item>

                        <Form.Item
                            label="确认密码"
                            name="repassword"
                            rules={passwordRules}
                            validateFirst
                        >
                            <Input.Password
                                prefix={<Lock size={16} className="text-gray-400"/>}
                                placeholder="请再次输入密码"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                block
                            >
                                注册
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </div>
        </>
    );
}

export default Register;
