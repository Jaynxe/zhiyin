import {apiClient} from "@/api/client";
import type {User, PaginationState, QueryParams} from "@/types";
import {isAxiosError} from "axios";
import React, {useEffect, useState} from "react";
import type {UploadFile} from "antd/es/upload/interface";
import {
    Table,
    Card,
    Button,
    Space,
    Input,
    Image,
    Tag,
    Modal,
    Form,
    Popconfirm,
    Select,
    Upload,
    message,
    type TableColumnsType, Dropdown, type MenuProps,
} from "antd";
import type {TablePaginationConfig} from "antd/es/table";
import {Search, FolderUp, Plus, Trash2, MoreHorizontal, UserRoundPen, Lock} from "lucide-react";
import {fullImagePath} from "@/utils/common";
import {UPLOAD_CONFIG} from "@/config/constants";
import RichTextEditor from "@/components/common/RichTextEditor.tsx";
import ImgCrop from "antd-img-crop";

function UserManage() {
    const [messageApi, contextHolder] = message.useMessage(); // 消息提示
    const [modal, modalContextHolder] = Modal.useModal();
    const [userList, setUserList] = useState<User[]>([]); // 用户列表数据
    const [loading, setLoading] = useState(false); // table加载状态
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [passwordForm] = Form.useForm();
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]); // 选中行的key
    const [pagination, setPagination] = useState<PaginationState>({
        // table分页状态
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [keyword, setKeyword] = useState(""); // 搜索关键词
    const [queryParams, setQueryParams] = useState<QueryParams>({
        // 查询参数
        page: 1,
        pageSize: 10,
        keyword: "",
    });

    const [modalVisible, setModalVisible] = useState(false);
    const [fileList, setFileList] = useState<UploadFile[]>([]); // 文件列表
    const [currentId, setCurrentId] = useState<string | null>(null); // 当前编辑的用户ID
    const [isEdit, setIsEdit] = useState(false); // 判断是编辑还是新增
    const [userform] = Form.useForm();
    // 监听查询参数变化加载数据
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await apiClient.getUserList(queryParams);
                setUserList(response.data!.list);
                setPagination({
                    current: queryParams.page,
                    pageSize: queryParams.pageSize,
                    total: response.data!.total,
                });
            } catch (err) {
                if (isAxiosError(err)) {
                    messageApi.error(
                        err.response?.data?.msg || "获取用户列表失败，请重试"
                    );
                } else {
                    messageApi.error("获取用户列表时发生未知错误");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [queryParams, messageApi]);

    // 搜索输入
    const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setKeyword(e.target.value);
    };

    // 搜索执行
    const handleSearch = () => {
        setQueryParams({page: 1, pageSize: pagination.pageSize, keyword});
    };

    // 表格分页变化
    const handleTableChange = ({current = 1, pageSize = 10}: TablePaginationConfig) => {
        setQueryParams({...queryParams, page: current, pageSize});
    };
    const handelDelete = async (ids: React.Key[]) => {
        try {
            const res = await apiClient.deleteUser(ids);
            messageApi.success(res.msg);
            setQueryParams((prev) => ({...prev}));
            setSelectedRowKeys([]);
        } catch (err) {
            if (isAxiosError(err)) {
                const msg = err.response?.data.msg;
                messageApi.error(msg);
                console.error(msg);
            } else {
                console.error("删除用户失败", err);
            }
        }
    };

    // 编辑用户弹窗打开
    const handleEdit = (record: User) => {
        setIsEdit(true);
        setCurrentId(record.id);
        userform.setFieldsValue(record); // 填充表单

        // 填充图片
        setFileList(
            record.avatar
                ? [
                    {
                        uid: "-1",
                        name: record.avatar.split("/").pop() || "avatar",
                        status: "done",
                        url: fullImagePath(record.avatar),
                    },
                ]
                : []
        );
        setModalVisible(true);
    };
    // 打开新增用户弹窗
    const handleAdd = () => {
        setIsEdit(false);
        setCurrentId(null);
        userform.resetFields();
        setFileList([]);
        setModalVisible(true);
    };
    // 关闭弹窗
    const handleModalCancel = () => {
        setModalVisible(false);
        userform.resetFields();
        setFileList([]);
        setCurrentId(null);
        setIsEdit(false);
    };

    const handlePasswordSubmit = async () => {
        try {
            const values = await passwordForm.validateFields();
            if (!currentId) return;

            const formData = new FormData();
            formData.append('password', values.password);  // 字段名和后端保持一致

            await apiClient.updateUserPassword(currentId, formData); // 传 formData 对象
            message.success("密码修改成功");
            setPasswordModalVisible(false);
            passwordForm.resetFields();
        } catch (error) {
            message.error("修改失败");
            console.error(error);
        }
    };

    // 弹窗确认提交
    const handleModalOk = async () => {
        try {
            const values = await userform.validateFields();
            const formData = new FormData();
                 Object.entries(values).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    if (Array.isArray(value)) {
                        value.forEach((item) => formData.append(key, item));
                    } else {
                        formData.append(key, value as string);
                    }
                }
            });

            if (isEdit) {
                if (!currentId) return;
                await apiClient.updateUser(currentId, formData);
                messageApi.success("更新成功");
            } else {
                await apiClient.createUser(formData);
                messageApi.success("创建成功");
            }

            handleModalCancel();
            setQueryParams((prev) => ({...prev})); // 触发刷新
        } catch (err) {
            if (isAxiosError(err)) {
                messageApi.error(
                    err.response?.data?.msg || (isEdit ? "更新失败" : "创建失败")
                );
            } else {
                console.error(err);
            }
        }
    };

    // 上传控制
    const handleUploadChange = ({
                                    file,
                                    fileList,
                                }: {
        file: UploadFile;
        fileList: UploadFile[];
    }) => {
        setFileList(fileList.slice(-1));

        if (file.status === "done") {
            try {
                const path = file.response?.data?.path;
                if (typeof path === "string") {
                    userform.setFieldsValue({avatar: path});
                    messageApi.success("上传成功");
                } else {
                    messageApi.error("上传失败：无效的文件路径");
                }
            } catch (error) {
                messageApi.error("上传失败：处理响应数据时出错");
                console.error(error);
            }
        } else if (file.status === "error") {
            messageApi.error("上传失败");
        }
    };
    //上传前验证
    const beforeUpload = (file: File) => {
        const isImage = UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES.some(
            (type: string) => file.type === type
        );
        if (!isImage) {
            messageApi.error(UPLOAD_CONFIG.IMAGE_TYPE_ERROR_MSG);
            return Upload.LIST_IGNORE;
        }
        const isLt2M = file.size / 1024 / 1024 < UPLOAD_CONFIG.IMAGE_MAX_FILE_SIZE;
        if (!isLt2M) {
            messageApi.error(UPLOAD_CONFIG.IMAGE_SIZE_ERROR_MSG);
            return Upload.LIST_IGNORE;
        }
        return true;
    };

    const usernameRules = [
        {required: true, message: "请输入用户名"},
        {min: 2, max: 20, message: "用户名长度必须在2-20个字符之间"},
        {
            pattern: /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/,
            message: "用户名只能包含汉字、字母、数字和下划线"
        }
    ];
    const passwordRules = [
        {required: true, message: "请输入密码"},
        {min: 8, max: 20, message: "密码长度必须在8-20个字符之间"},
        {
            pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/,
            message: "密码必须包含字母和数字"
        }
    ];
    const columns: TableColumnsType<User> = [
        {title: "ID", dataIndex: "id", key: "id", ellipsis: true, hidden: true},
        {title: "用户名", dataIndex: "username", key: "username"},
        {
            title: "昵称",
            dataIndex: "nickname",
            key: "nickname",
            ellipsis: true,
        },


        {
            title: "头像",
            dataIndex: "avatar",
            key: "avatar",
            render: (avatar) => (
                <Image
                    src={fullImagePath(avatar)}
                    width={60}
                    height={60}
                    alt="图片"
                    style={{objectFit: "cover", borderRadius: 4}}
                />
            ),
        },
        {
            title: "邮箱",
            dataIndex: "email",
            key: "email",
            ellipsis: true,
        },
        {
            title: "电话",
            dataIndex: "mobile",
            key: "mobile",
            ellipsis: true,
        },

        {
            title: "状态",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={status === "0" ? "green" : "red"}>
                    {status === "0" ? "正常" : "封号"}
                </Tag>
            ),
        },
        {
            title: "角色",
            dataIndex: "role",
            key: "role",
            render: (role) => (
                <Tag color={role === "0" ? "blue" : "pink"}>
                    {role === "0" ? "管理员" : "普通用户"}
                </Tag>
            ),
        },
        {
            title: "性别",
            dataIndex: "gender",
            key: "gender",
            render: (gender) => (
                <Tag color={gender === "M" ? "blue" : "pink"}>
                    {gender === "M" ? "男" : "女"}
                </Tag>
            ),
        },

        // {title: "创建时间", dataIndex: "create_time", key: "create_time"},
        // {title: "更新时间", dataIndex: "update_time", key: "update_time"},
        {
            title: "操作",
            key: "action",
            width: 80,
            render: (_, record) => {
                const items: MenuProps['items'] = [
                    {
                        key: "edit",
                        label: "编辑",
                        icon: <UserRoundPen size={16}/>,
                        onClick: () => handleEdit(record),
                    },
                    {
                        key: "delete",
                        icon: <Trash2 size={16}/>,
                        label: "删除",
                        onClick: () => {
                            modal.confirm({
                                title: "删除用户",
                                content: "你确定要删除这个用户吗?",
                                okText: "确定",
                                cancelText: "取消",
                                onOk: () => handelDelete([record.id]),
                            });
                        },
                    },
                    {
                        key: "changePassword",
                        label: "修改密码",
                        icon: <Lock size={16}/>,
                        onClick: () => {
                            setCurrentId(record.id);
                            passwordForm.resetFields();
                            setPasswordModalVisible(true);
                        },
                    },
                ];

                return (
                    <Dropdown menu={{items}} trigger={["click"]}>
                        <MoreHorizontal className="cursor-pointer text-blue-500" strokeWidth={2} size={20}/>
                    </Dropdown>
                );
            },
        }
    ];

    return (
        <>
            {contextHolder}
            {modalContextHolder}
            <Card
                title="用户管理"
                extra={
                    <Space>
                        <Input
                            placeholder="搜索..."
                            value={keyword}
                            onChange={handleKeywordChange}
                            onPressEnter={handleSearch}
                            style={{width: 200}}
                            suffix={
                                <Search
                                    size={16}
                                    style={{cursor: "pointer"}}
                                    onClick={handleSearch}
                                />
                            }
                        />
                        <Button
                            type="primary"
                            onClick={handleAdd}
                            icon={<Plus size={18}/>}
                        >
                            添加用户
                        </Button>
                        <Popconfirm
                            title="批量删除用户"
                            description={`你确定要删除${selectedRowKeys.length}个用户吗?`}
                            onConfirm={() => handelDelete(selectedRowKeys)}
                            okText="确定"
                            cancelText="取消"
                        >
                            <Button
                                danger
                                disabled={selectedRowKeys.length === 0}
                                icon={<Trash2 size={18}/>}
                            >
                                批量删除
                            </Button>
                        </Popconfirm>
                    </Space>
                }
            >
                <Table
                    columns={columns}
                    dataSource={userList}
                    rowKey="id"
                    loading={loading}
                    rowSelection={{selectedRowKeys, onChange: setSelectedRowKeys}}
                    pagination={{
                        ...pagination,
                        showSizeChanger: true,
                        pageSizeOptions: ["5", "10", "15", "20"],
                        showTotal: (total) => `共 ${total} 条`,
                        showQuickJumper: true,
                    }}
                    expandable={{
                        expandedRowRender: (record) => {
                            const html = record.description || "";
                            return (
                                <div>
                                    <span className="font-bold">用户简介：</span>
                                    <div
                                         dangerouslySetInnerHTML={{__html: html}}
                                    />
                                </div>
                            );
                        }
                    }}

                    onChange={handleTableChange}
                />

                <Modal
                    title={isEdit ? "编辑用户" : "新增用户"}
                    open={modalVisible}
                    onOk={handleModalOk}
                    onCancel={handleModalCancel}
                    okText="提交"
                    cancelText="取消"
                >
                    <Form form={userform} layout="vertical">
                        <Form.Item
                            name="username"
                            label="用户名"
                            rules={usernameRules}
                        >
                            <Input placeholder="请输入用户名"/>
                        </Form.Item>
                        <Form.Item
                            name="nickname"
                            label="昵称"
                        >
                            <Input placeholder="请输入昵称"/>
                        </Form.Item>
                        <Form.Item
                            name="email"
                            label="邮箱"
                            rules={[
                                {required: !isEdit, message: "请输入邮箱地址"},
                                {type: "email", message: "请输入合法的邮箱地址"},
                            ]}
                        >
                            <Input placeholder="请输入邮箱"/>
                        </Form.Item>
                        <Form.Item
                            name="role"
                            label="角色"
                            rules={[{required: true, message: "请选择角色"}]}
                        >
                            <Select
                                options={[
                                    {value: "0", label: "管理员"},
                                    {value: "1", label: "普通用户"},
                                ]}
                            />
                        </Form.Item>
                        <Form.Item
                            name="status"
                            label="状态"
                            rules={[{required: true, message: "请选择状态"}]}
                        >
                            <Select
                                options={[
                                    {value: "0", label: "正常"},
                                    {value: "1", label: "封号"},
                                ]}
                            />
                        </Form.Item>
                        <Form.Item
                            name="gender"
                            label="性别"
                            rules={[{required: true, message: "请选择性别"}]}
                        >
                            <Select
                                options={[
                                    {value: "M", label: "男"},
                                    {value: "F", label: "女"},
                                ]}
                            />
                        </Form.Item>
                        <Form.Item
                            name="description"
                            label="描述"
                        >
                            <RichTextEditor uploadType="cover"/>
                        </Form.Item>
                        <Form.Item
                            name="avatar"
                            label="头像"
                        >
                            <ImgCrop
                                rotationSlider
                                cropShape="round"
                                showGrid
                                aspect={1}
                                modalTitle="裁剪头像"
                            >
                                <Upload
                                    name="file"
                                    listType="picture"
                                    maxCount={1}
                                    fileList={fileList}
                                    action={`${import.meta.env.VITE_API_BASE}/upload/?type=avatar`}
                                    onChange={handleUploadChange}
                                    beforeUpload={beforeUpload}
                                >
                                    <Button icon={<FolderUp size={20}/>}>上传头像</Button>
                                </Upload>
                            </ImgCrop>

                        </Form.Item>
                    </Form>
                </Modal>
                <Modal
                    title="修改密码"
                    open={passwordModalVisible}
                    onOk={handlePasswordSubmit}
                    onCancel={() => {
                        setPasswordModalVisible(false);
                        passwordForm.resetFields();
                    }}
                    okText="提交"
                    cancelText="取消"
                >
                    <Form form={passwordForm} layout="vertical">
                        <Form.Item
                            name="password"
                            label="新密码"
                            rules={passwordRules}
                        >
                            <Input.Password placeholder="请输入新密码"/>
                        </Form.Item>
                        <Form.Item
                            name="confirmPassword"
                            label="确认密码"
                            dependencies={["password"]}
                            rules={[
                                ...passwordRules,
                                ({getFieldValue}) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue("password") === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error("两次输入的密码不一致"));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password placeholder="请再次输入新密码"/>
                        </Form.Item>
                    </Form>
                </Modal>

            </Card>
        </>
    );
}

export default UserManage;
