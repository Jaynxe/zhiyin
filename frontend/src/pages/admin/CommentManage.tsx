import {apiClient} from "@/api/client";
import type {Comment, PaginationState, QueryParams} from "@/types";
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
    type TableColumnsType,
} from "antd";
import type {TablePaginationConfig} from "antd/es/table";
import {Search, Trash2} from "lucide-react";
import RichTextEditor from "@/components/common/RichTextEditor.tsx";


function CommentManage() {
    const [messageApi, contextHolder] = message.useMessage(); // 消息提示
    const [commentList, setCommentList] = useState<Comment[]>([]); // 评论列表数据
    const [loading, setLoading] = useState(false); // table加载状态
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
    const [modalVisible, setModalVisible] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);

    const [form] = Form.useForm();

    // 监听查询参数变化加载数据
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await apiClient.getCommentList(queryParams);
                setCommentList(response.data!.list);
                setPagination({
                    current: queryParams.page,
                    pageSize: queryParams.pageSize,
                    total: response.data!.total,
                });
            } catch (err) {
                if (isAxiosError(err)) {
                    messageApi.error(
                        err.response?.data?.msg || "获取评论列表失败，请重试"
                    );
                } else {
                    messageApi.error("获取评论列表时发生未知错误");
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
    const handleTableChange = ({current = 1, pageSize = 5}: TablePaginationConfig) => {
        setQueryParams({...queryParams, page: current, pageSize});
    };

    // 编辑评论弹窗打开
    const handleEdit = (record: Comment) => {
        setCurrentId(record.id);
        form.setFieldsValue(record); // 填充表单
        setModalVisible(true);
    };
    // 关闭弹窗
    const handleModalCancel = () => {
        setModalVisible(false);
        form.resetFields();
        setCurrentId(null);
    };


    // 弹窗确认提交
    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
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
            await apiClient.updateComment(currentId, formData);
            messageApi.success("更新成功");

            handleModalCancel();
            setQueryParams((prev) => ({...prev})); // 触发刷新
        } catch (err) {
            if (isAxiosError(err)) {
                messageApi.error(
                    err.response?.data?.msg || "更新失败"
                );
            } else {
                console.error(err);
            }
        }
    };
    const handelDelete = async (ids: React.Key[]) => {
        try {
            const res = await apiClient.deleteComment(ids);
            messageApi.success(res.msg);
            setQueryParams((prev) => ({...prev}));
            setSelectedRowKeys([]);
        } catch (err) {
            if (isAxiosError(err)) {
                const msg = err.response?.data.msg;
                messageApi.error(msg);
                console.error(msg);
            } else {
                console.error("删除评论失败", err);
            }
        }
    };
    const columns: TableColumnsType<Comment> = [
        {title: "ID", dataIndex: "id", key: "id", ellipsis: true, hidden: true},
        {title: "评论用户", dataIndex: "username", key: "username"},
        {title: "评论歌曲", dataIndex: "song_name", key: "song_name"},
        {
            title: "状态",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={status === "0" ? "green" : "red"}>
                    {status === "0" ? "正常" : "禁用"}
                </Tag>
            ),
        },

        {title: "层级", dataIndex: "level", key: "level"},
        {title: "点赞数", dataIndex: "like_count", key: "like_count"},
        {title: "评论时间", dataIndex: "comment_time", key: "comment_time"},
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
                        title="删除评论"
                        description="你确定要删除这条评论吗?"
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
                title="评论管理"
                extra={
                    <Space>
                        <Input
                            placeholder="搜索评论"
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
                            title="批量删除评论"
                            description={`你确定要删除${selectedRowKeys.length}条评论吗?`}
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
                    dataSource={commentList}
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
                    expandable={{
                        expandedRowRender: (record) => (
                            <div dangerouslySetInnerHTML={{__html: record.content || ""}}/>
                        ),
                    }}
                />

                <Modal
                    title="编辑评论"
                    open={modalVisible}
                    onOk={handleModalOk}
                    onCancel={handleModalCancel}
                    okText="提交"
                    cancelText="取消"
                >
                    <Form form={form} layout="vertical">
                        <Form.Item
                            name="content"
                            label="评论内容"
                            rules={[{required: true, message: "请输入内容"}]}
                        >
                            <RichTextEditor/>
                        </Form.Item>

                        <Form.Item name="status" label="状态">
                            <Select
                                style={{width: 120}}
                                options={[
                                    {value: "0", label: "正常"},
                                    {value: "1", label: "禁用"},
                                ]}
                            />
                        </Form.Item>
                    </Form>
                </Modal>
            </Card>
        </>
    );
}

export default CommentManage;
