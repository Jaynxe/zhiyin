import {apiClient} from "@/api/client";
import type {
    Category,
    Language,
    PaginationState,
    QueryParams,
} from "@/types";
import {
    Button,
    Card,
    Form,
    Input,
    message,
    Modal,
    Popconfirm,
    Space,
    Table,
    type TableColumnsType,
    type TablePaginationConfig,
} from "antd";
import {isAxiosError} from "axios";
import {Plus, Search, Trash2} from "lucide-react";
import React, {useEffect, useState} from "react";

function CategoryManage() {
    const [messageApi, contextHolder] = message.useMessage(); // 消息提示
    const [keyword, setKeyword] = useState(""); // 搜索关键词
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]); // 选中行的key
    const [loading, setLoading] = useState(false);
    const [CategoryList, setCategoryList] = useState<Category[]>([]);
    const [isEdit, setIsEdit] = useState(false); // 判断是编辑还是新增
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [queryParams, setQueryParams] = useState<QueryParams>({
        // 查询参数
        page: 1,
        pageSize: 5,
        keyword: "",
    });
    const [form] = Form.useForm();
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

    // 编辑弹窗打开
    const handleEdit = (record: Language) => {
        setIsEdit(true);
        setCurrentId(record.id);
        form.setFieldsValue(record); // 填充表单

        setModalVisible(true);
    };

    // 打开新增弹窗
    const handleAdd = () => {
        setIsEdit(false);
        setCurrentId(null);
        form.resetFields();
        setModalVisible(true);
    };
    // 关闭弹窗
    const handleModalCancel = () => {
        setModalVisible(false);
        form.resetFields();
        setCurrentId(null);
        setIsEdit(false);
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
            if (isEdit) {
                if (!currentId) return;
                await apiClient.updateCategory(currentId, formData);
                messageApi.success("更新成功");
            } else {
                await apiClient.createCategory(formData);
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
    // 监听查询参数变化加载数据
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await apiClient.getCategoryList(queryParams);
                setCategoryList(response.data!.list);
                setPagination({
                    current: queryParams.page,
                    pageSize: queryParams.pageSize,
                    total: response.data!.total,
                });
            } catch (err) {
                if (isAxiosError(err)) {
                    messageApi.error(err.response?.data?.msg || "获取分类失败，请重试");
                } else {
                    messageApi.error("获取分类时发生未知错误");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [queryParams, messageApi]);

    const handelDelete = async (ids: React.Key[]) => {
        try {
            const res = await apiClient.deleteCategory(ids);
            messageApi.success(res.msg);
            setQueryParams((prev) => ({...prev}));
            setSelectedRowKeys([]);
        } catch (err) {
            if (isAxiosError(err)) {
                const msg = err.response?.data.msg;
                messageApi.error(msg);
                console.error(msg);
            } else {
                console.error("删除分类失败", err);
            }
        }
    };
    const columns: TableColumnsType<Language> = [
        {title: "ID", dataIndex: "id", key: "id", ellipsis: true, hidden: true},
        {title: "名称", dataIndex: "name", key: "name"},

        {title: "创建时间", dataIndex: "create_time", key: "create_time"},
        {title: "更新时间", dataIndex: "update_time", key: "update_time"},
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
                        title="删除日志"
                        description="你确定要删除这门分类吗?"
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
                title="分类管理"
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
                            icon={<Plus size={18}/>}
                            onClick={() => handleAdd()}
                        >
                            新增
                        </Button>
                        <Popconfirm
                            title="批量删除日志"
                            description={`你确定要删除这${selectedRowKeys.length}门分类吗?`}
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
                    dataSource={CategoryList}
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
                    title={isEdit ? "编辑分类" : "新增分类"}
                    open={modalVisible}
                    onOk={handleModalOk}
                    onCancel={handleModalCancel}
                    okText="提交"
                    cancelText="取消"
                >
                    <Form form={form} layout="vertical">
                        <Form.Item
                            name="name"
                            label="分类"
                            rules={[{required: true, message: "请输入分类"}]}
                        >
                            <Input placeholder="请输入分类"/>
                        </Form.Item>
                    </Form>
                </Modal>
            </Card>
        </>
    );
}

export default CategoryManage;
