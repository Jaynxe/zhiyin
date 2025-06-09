import {apiClient} from "@/api/client";
import type {Notice, PaginationState, QueryParams, User} from "@/types";
import {isAxiosError} from "axios";
import React, {useEffect, useState} from "react";
import {
    Table,
    Card,
    Button,
    Space,
    Input,
    Tag,
    Modal,
    Form,
    Popconfirm,
    Select,
    message,
    type TableColumnsType, Tooltip,
} from "antd";
import type {TablePaginationConfig} from "antd/es/table";
import {Search, Plus, Trash2} from "lucide-react";
import RichTextEditor from "@/components/common/RichTextEditor.tsx";
import {useDebouncedCallback} from "use-debounce";

function NoticeManage() {
    const [messageApi, contextHolder] = message.useMessage(); // 消息提示
    const [NoticeList, setNoticeList] = useState<Notice[]>([]); // 通知列表数据
    const [loading, setLoading] = useState(false); // table加载状态
    const [isAnnouncement, setIsAnnouncement] = useState(true); // 是否为系统公告
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]); // 选中行的key
    const [pagination, setPagination] = useState<PaginationState>({
        // table分页状态
        current: 1,
        pageSize: 5,
        total: 0,
    });
    const [keyword, setKeyword] = useState(""); // 搜索关键词
    const [queryParams, setQueryParams] = useState<QueryParams>({
        // 查询参数
        page: 1,
        pageSize: 5,
        keyword: "",
    });
    const [userOptions, setUserOptions] = useState<{ label: string; value: string }[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [isEdit, setIsEdit] = useState(false); // 判断是编辑还是新增

    const [form] = Form.useForm();

    // 监听查询参数变化加载数据
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await apiClient.getNoticeList(queryParams);
                setNoticeList(response.data!.list);
                setPagination({
                    current: queryParams.page,
                    pageSize: queryParams.pageSize,
                    total: response.data!.total,
                });
            } catch (err) {
                if (isAxiosError(err)) {
                    messageApi.error(
                        err.response?.data?.msg || "获取通知列表失败，请重试"
                    );
                } else {
                    messageApi.error("获取通知列表时发生未知错误");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [queryParams, messageApi]);

    const fetchUsers = async (keyword = "") => {
        try {
            const res = await apiClient.getUserList({
                page: 1,
                pageSize: 20,
                keyword,
            });
            const options = res.data!.list.map((user: User) => ({
                label: user.username,
                value: user.id,
            }));
            setUserOptions(options);
        } catch (err) {
            messageApi.error("获取用户列表失败");
            console.error(err);
        }
    };
    const handleUserSearch = useDebouncedCallback(async (term) => {
        await fetchUsers(term);
    }, 1000);

    // 搜索输入
    const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setKeyword(e.target.value);
    };

    // 搜索执行
    const handleSearch = () => {
        setQueryParams({page: 1, pageSize: pagination.pageSize, keyword});
    };

    // 表格分页变化
    const handleTableChange = ({current = 1, pageSize = 5}: TablePaginationConfig) => {
        setQueryParams({...queryParams, page: current, pageSize});
    };


    // 编辑通知弹窗打开
    const handleEdit = (record: Notice) => {
        setIsEdit(true);
        setCurrentId(record.id);
        form.setFieldsValue(record); // 填充表单

        setModalVisible(true);
    };

    // 打开新增通知弹窗
    const handleAdd = () => {
        setIsEdit(false);
        setCurrentId(null);
        form.resetFields();
        setModalVisible(true);
        // 默认值：状态为发布，类型为系统公告
        form.setFieldsValue({
            status: "0",
            type: "announcement",
        });

        // ⚠️ 注意延迟执行，等待表单 setFields 后触发
        setTimeout(async () => {
            const type = form.getFieldValue("type");
            if (type === "notification") {
                await fetchUsers();
            }
        }, 0);
    };

    const handelDelete = async (ids: React.Key[]) => {
        try {
            const res = await apiClient.deleteNotice(ids);
            messageApi.success(res.msg);
            setQueryParams((prev) => ({...prev}));
            setSelectedRowKeys([]);
        } catch (err) {
            if (isAxiosError(err)) {
                const msg = err.response?.data.msg;
                messageApi.error(msg);
                console.error(msg);
            } else {
                console.error("删除通知失败", err);
            }
        }
    };

    // 关闭弹窗
    const handleModalCancel = () => {
        setModalVisible(false);
        form.resetFields();
        setCurrentId(null);
        setIsEdit(false);
        setIsAnnouncement(true)
    };

    // 弹窗确认提交
    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();

            const formData = new FormData();
            Object.entries(values).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach((item) => {
                        formData.append(key, item);
                    });
                } else if (value !== null && value !== undefined && value !== '') {
                    formData.append(key, value as string);
                }
            });


            if (isEdit) {
                if (!currentId) return;
                await apiClient.updateNotice(currentId, formData);
                messageApi.success("更新成功");
            } else {
                const type = form.getFieldValue("type");
                if (type === "announcement") {
                    await apiClient.createAnnouncement(formData);
                } else {
                    await apiClient.createNotice(formData);
                }
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

    const columns: TableColumnsType<Notice> = [
        {title: "ID", dataIndex: "id", key: "id", ellipsis: true, hidden: true},
        {title: "标题", dataIndex: "title", key: "title"},
        {
            title: "类型", dataIndex: "type", key: "type", render: (type: string) => (
                <Tag color={type === "announcement" ? "red" : "blue"}>
                    {type === "announcement" ? "系统公告" : "普通通知"}
                </Tag>
            ),
        },
        {
            title: "内容",
            dataIndex: "content",
            key: "content",
            ellipsis: true,
            render: (text: string | null) => (
                <Tooltip
                    title={<div dangerouslySetInnerHTML={{__html: text || ""}}/>}
                    style={{maxWidth: 400}}
                >
                    <div
                        style={{
                            maxWidth: 200,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {(text ? text.replace(/<[^>]+>/g, "").slice(0, 30) : "") + ""}
                    </div>
                </Tooltip>
            ),
        },
        {
            title: "状态",
            dataIndex:
                "status",
            key:
                "status",
            render:
                (status) => (
                    <Tag color={status === "0" ? "green" : "red"}>
                        {status === "0" ? "发布" : "下线"}
                    </Tag>
                ),
        },
        {
            title: "创建时间", dataIndex:
                "create_time", key:
                "create_time"
        },
        {
            title: "操作",
            key:
                "action",
            width:
                200,
            render:
                (_, record) => (
                    <Space>
                        <Button
                            type="primary"
                            size="small"
                            onClick={() => handleEdit(record)}
                        >
                            编辑
                        </Button>

                        <Popconfirm
                            title="删除通知"
                            description="你确定要删除这条通知吗?"
                            onConfirm={() => handelDelete([record.id])}
                            okText="确定"
                            cancelText="取消"
                        >
                            <Button danger size="small">
                                删除
                            </Button>
                        </Popconfirm>
                    </Space>
                ),
        },
    ];

    return (
        <>
            {contextHolder}
            <Card
                title="通知管理"
                extra={
                    <Space>
                        <Input
                            placeholder="搜索通知标题"
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
                            添加通知
                        </Button>
                        <Popconfirm
                            title="批量删除通知"
                            description={`你确定要删除${selectedRowKeys.length}条通知吗?`}
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
                    dataSource={NoticeList}
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
                    onChange={handleTableChange}
                />

                <Modal
                    title={isEdit ? "编辑通知" : "新增通知"}
                    open={modalVisible}
                    onOk={handleModalOk}
                    onCancel={handleModalCancel}
                    okText="提交"
                    cancelText="取消"
                >
                    <Form form={form} layout="vertical">
                        <Form.Item
                            name="title"
                            label="标题"
                            rules={[{required: true, message: "请输入标题"}]}
                        >
                            <Input placeholder="请输入标题"/>
                        </Form.Item>
                        <Form.Item
                            name="content"
                            label="内容"
                            rules={[{required: true, message: "请输入通知内容"}]}
                        >
                            <RichTextEditor uploadType="cover"/>
                        </Form.Item>

                        <Form.Item name="status" label="状态">
                            <Select
                                style={{width: 120}}
                                options={[
                                    {value: "0", label: "发布"},
                                    {value: "1", label: "下线"},
                                ]}
                            />
                        </Form.Item>
                        {!isEdit && <Form.Item name="type" label="通知类型">
                            <Select
                                style={{width: 120}}
                                onChange={async (value) => {
                                    setIsAnnouncement(value === "announcement");
                                    if (value === "notification") {
                                        await fetchUsers();
                                    }
                                }}
                                options={[
                                    {value: "announcement", label: "系统公告"},
                                    {value: "notification", label: "普通通知"},
                                ]}
                            />
                        </Form.Item>}

                        {!isAnnouncement && !isEdit && (
                            <Form.Item
                                name="receivers"
                                label="接收用户"
                                rules={[{required: true, message: "请选择接收用户"}]}
                            >
                                <Select
                                    mode="multiple"
                                    placeholder="请选择接收用户"
                                    showSearch
                                    filterOption={false}
                                    onSearch={(value) => {
                                        handleUserSearch(value);
                                    }}
                                    options={userOptions}
                                />
                            </Form.Item>
                        )}
                    </Form>
                </Modal>
            </Card>
        </>
    );
}

export default NoticeManage;
