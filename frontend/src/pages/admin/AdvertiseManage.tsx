import {apiClient} from "@/api/client";
import type {Advertise, PaginationState, QueryParams} from "@/types";
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
    type TableColumnsType,
} from "antd";
import type {TablePaginationConfig} from "antd/es/table";
import {Search, FolderUp, Plus, Trash2} from "lucide-react";
import {fullImagePath} from "@/utils/common";
import {UPLOAD_CONFIG} from "@/config/constants";

function AdvertiseManage() {
    const [messageApi, contextHolder] = message.useMessage(); // 消息提示
    const [advertiseList, setAdvertiseList] = useState<Advertise[]>([]); // 广告列表数据
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
    const [fileList, setFileList] = useState<UploadFile[]>([]); // 文件列表
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [isEdit, setIsEdit] = useState(false); // 判断是编辑还是新增

    const [form] = Form.useForm();

    // 监听查询参数变化加载数据
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await apiClient.getAdvertise(queryParams);
                setAdvertiseList(response.data!.list);
                setPagination({
                    current: queryParams.page,
                    pageSize: queryParams.pageSize,
                    total: response.data!.total,
                });
            } catch (err) {
                if (isAxiosError(err)) {
                    messageApi.error(
                        err.response?.data?.msg || "获取广告列表失败，请重试"
                    );
                } else {
                    messageApi.error("获取广告列表时发生未知错误");
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

    // 编辑广告弹窗打开
    const handleEdit = (record: Advertise) => {
        setIsEdit(true);
        setCurrentId(record.id);
        form.setFieldsValue(record); // 填充表单

        // 填充图片
        setFileList(
            record.cover
                ? [
                    {
                        uid: "-1",
                        name: record.cover.split("/").pop() || "cover",
                        status: "done",
                        url: fullImagePath(record.cover),
                    },
                ]
                : []
        );
        setModalVisible(true);
    };

    // 打开新增广告弹窗
    const handleAdd = () => {
        setIsEdit(false);
        setCurrentId(null);
        form.resetFields();
        setFileList([]);
        setModalVisible(true);
    };

    const handelDelete = async (ids: React.Key[]) => {
        try {
            const res = await apiClient.deleteAdvertise(ids);
            messageApi.success(res.msg);
            setQueryParams((prev) => ({...prev}));
            setSelectedRowKeys([]);
        } catch (err) {
            if (isAxiosError(err)) {
                const msg = err.response?.data.msg;
                messageApi.error(msg);
                console.error(msg);
            } else {
                console.error("删除广告失败", err);
            }
        }
    };

    // 关闭弹窗
    const handleModalCancel = () => {
        setModalVisible(false);
        form.resetFields();
        setFileList([]);
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
                await apiClient.updateAdvertise(currentId, formData);
                messageApi.success("更新成功");
            } else {
                await apiClient.createAdvertise(formData);
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
                    form.setFieldsValue({cover: path});
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

    const columns: TableColumnsType<Advertise> = [
        {title: "ID", dataIndex: "id", key: "id", ellipsis: true, hidden: true},
        {title: "标题", dataIndex: "title", key: "title"},
        {
            title: "链接",
            dataIndex: "link",
            key: "link",
            ellipsis: true,
        },
        {
            title: "图片",
            dataIndex: "cover",
            key: "cover",
            render: (cover) => (
                <Image
                    src={`${import.meta.env.VITE_API_BASE}/upload/${cover}`}
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
                <Tag color={status === "0" ? "green" : "red"}>
                    {status === "0" ? "已发布" : "已下线"}
                </Tag>
            ),
        },
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
                        title="删除广告"
                        description="你确定要删除这条广告吗?"
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
                title="广告管理"
                extra={
                    <Space>
                        <Input
                            placeholder="搜索广告标题"
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
                            添加广告
                        </Button>
                        <Popconfirm
                            title="批量删除广告"
                            description={`你确定要删除${selectedRowKeys.length}条广告吗?`}
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
                    dataSource={advertiseList}
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
                    title={isEdit ? "编辑广告" : "新增广告"}
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
                            name="link"
                            label="链接"
                            rules={[{required: true, message: "请输入链接"}]}
                        >
                            <Input placeholder="请输入链接"/>
                        </Form.Item>
                        <Form.Item
                            name="cover"
                            label={"图片"}
                            rules={[{required: true, message: "请上传图片"}]}
                        >
                            <Upload
                                name="file"
                                listType="picture"
                                maxCount={1}
                                fileList={fileList}
                                action={`${
                                    import.meta.env.VITE_API_BASE
                                }/upload/?type=advertise`}
                                onChange={handleUploadChange}
                                beforeUpload={beforeUpload}
                            >
                                <Button icon={<FolderUp size={20}/>}>点击上传</Button>
                            </Upload>
                        </Form.Item>
                        <Form.Item name="status" label="状态">
                            <Select
                                style={{width: 120}}
                                options={[
                                    {value: "0", label: "已发布"},
                                    {value: "1", label: "已下线"},
                                ]}
                            />
                        </Form.Item>
                    </Form>
                </Modal>
            </Card>
        </>
    );
}

export default AdvertiseManage;
