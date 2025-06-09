import {apiClient} from "@/api/client";
import RichTextEditor from "@/components/common/RichTextEditor.tsx";
import type {Feedback, PaginationState, QueryParams} from "@/types";
import {fullImagePath, isEmptyContent} from "@/utils/common";
import {
    Button,
    Card,
    Input,
    message,
    Popconfirm,
    Space,
    Table,
    Image,
    Tag,
    type TableColumnsType,
    type TablePaginationConfig,
    Form,
    Modal,
    Select,
} from "antd";
import {useForm} from "antd/es/form/Form";
import {isAxiosError} from "axios";
import {Search, Trash2} from "lucide-react";
import React, {useEffect, useState} from "react";

function FeedbackManage() {
    const [messageApi, contextHolder] = message.useMessage(); // 消息提示
    const [keyword, setKeyword] = useState(""); // 搜索关键词
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]); // 选中行的key
    const [loading, setLoading] = useState(false);
    const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
    const [form] = useForm();
    const [modalVisible, setModalVisible] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [queryParams, setQueryParams] = useState<QueryParams>({
        // 查询参数
        page: 1,
        pageSize: 5,
        keyword: "",
    });
    const [pagination, setPagination] = useState<PaginationState>({
        // table分页状态
        current: 1,
        pageSize: 5,
        total: 0,
    });
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
    // 编辑广告弹窗打开
    const handleEdit = (record: Feedback) => {
        setCurrentId(record.id);
        form.setFieldsValue(record); // 填充表单
        setModalVisible(true);
    };

    const handleModalCancel = () => {
        setModalVisible(false);
        form.resetFields();
        setCurrentId(null);
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();

            // 对 reply 字段做特殊判断
            if (isEmptyContent(values.reply)) {
                messageApi.warning("回复内容不能为空");
                return;
            }

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
            if (!currentId) return;
            await apiClient.updateFeedback(currentId, formData);
            messageApi.success("更新成功");

            handleModalCancel();
            setQueryParams((prev) => ({...prev})); // 触发刷新
        } catch (err) {
            if (isAxiosError(err)) {
                messageApi.error(err.response?.data?.msg || "更新失败");
            } else {
                console.error(err);
            }
        }
    };

    // 监听查询参数变化加载数据
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await apiClient.getFeedbackList(queryParams);
                setFeedbackList(response.data!.list);
                setPagination({
                    current: queryParams.page,
                    pageSize: queryParams.pageSize,
                    total: response.data!.total,
                });
            } catch (err) {
                if (isAxiosError(err)) {
                    messageApi.error(
                        err.response?.data?.msg || "获取登录反馈失败，请重试"
                    );
                } else {
                    messageApi.error("获取登录反馈时发生未知错误");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [queryParams, messageApi]);

    const handelDelete = async (ids: React.Key[]) => {
        try {
            const res = await apiClient.deleteFeedback(ids);
            messageApi.success(res.msg);
            setQueryParams((prev) => ({...prev}));
            setSelectedRowKeys([]);
        } catch (err) {
            if (isAxiosError(err)) {
                const msg = err.response?.data.msg;
                messageApi.error(msg);
                console.error(msg);
            } else {
                console.error("删除反馈失败", err);
            }
        }
    };
    const columns: TableColumnsType<Feedback> = [
        {title: "ID", dataIndex: "id", key: "id", ellipsis: true, hidden: true},
        {title: "用户名", dataIndex: "username", key: "username"},
        {title: "标题", dataIndex: "title", key: "title"},
        {title: "邮箱", dataIndex: "email", key: "email", ellipsis: true},
        {
            title: "截图",
            dataIndex: "feedback_screenshot",
            key: "feedback_screenshot",
            render: (feedback_screenshot) => (
                <Image
                    src={fullImagePath(feedback_screenshot)}
                    width={60}
                    height={60}
                    alt="图片"
                    style={{objectFit: "cover", borderRadius: 4}}
                />
            ),
        },
        {
            title: "状态",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={status === "0" ? "yellow" : "green"}>
                    {status === "0" ? "待处理" : "已处理"}
                </Tag>
            ),
        },
        {
            title: "反馈时间",
            dataIndex: "create_time",
            key: "create_time",
            ellipsis: true,
        },
        {
            title: "更新时间",
            dataIndex: "update_time",
            key: "update_time",
            ellipsis: true,
        },

        {
            title: "操作",
            key: "action",
            width: 200,
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        size="small"
                        onClick={() => handleEdit(record)}
                    >
                        编辑
                    </Button>
                    <Popconfirm
                        title="删除反馈"
                        description="你确定要删除这条反馈吗?"
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
                title="反馈管理"
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
                        <Popconfirm
                            title="批量删除反馈"
                            description={`你确定要删除${selectedRowKeys.length}条反馈吗?`}
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
                    dataSource={feedbackList}
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
                        expandedRowRender: (record) => (
                            <div className="space-y-4">
                                {/* 内容部分 */}
                                <div
                                    className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                                    <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-2">反馈:</h4>
                                    <div
                                        className="prose prose-sm dark:prose-invert max-w-none"
                                        dangerouslySetInnerHTML={{__html: record.content || ""}}
                                    />
                                </div>

                                {/* 回复部分 */}
                                {record.reply && (
                                    <div
                                        className="bg-[#4f46e5]/10 dark:bg-[#4f46e5]/20 p-4 rounded-md">
                                        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">回复:</h4>
                                        <div
                                            className="prose prose-sm dark:prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{__html: record.reply || ""}}
                                        />
                                    </div>
                                )}
                            </div>
                        ),
                    }}
                    onChange={handleTableChange}
                />

                <Modal
                    title={"编辑反馈"}
                    open={modalVisible}
                    onOk={handleModalOk}
                    onCancel={handleModalCancel}
                    okText="提交"
                    cancelText="取消"
                >
                    <Form form={form} layout="vertical">
                        <Form.Item
                            name="reply"
                            label="回复"
                            rules={[{required: true, message: "请输入回复内容"}]}
                        >
                            <RichTextEditor uploadType="feedback"/>
                        </Form.Item>
                        <Form.Item name="status" label="状态">
                            <Select
                                style={{width: 120}}
                                options={[
                                    {value: "0", label: "待处理"},
                                    {value: "1", label: "已处理"},
                                ]}
                            />
                        </Form.Item>
                    </Form>
                </Modal>
            </Card>
        </>
    );
}

export default FeedbackManage;
