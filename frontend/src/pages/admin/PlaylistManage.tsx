import {apiClient} from "@/api/client";
import type {Playlist, PaginationState, QueryParams, Category} from "@/types";
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
    type TableColumnsType, type MenuProps, Dropdown,
} from "antd";
import type {TablePaginationConfig} from "antd/es/table";
import {Search, FolderUp, Plus, Trash2, UserRoundPen, MoreHorizontal} from "lucide-react";
import {fullImagePath} from "@/utils/common";
import {UPLOAD_CONFIG} from "@/config/constants";
import RichTextEditor from "@/components/common/RichTextEditor.tsx";

function PlaylistManage() {
    const [messageApi, contextHolder] = message.useMessage(); // 消息提示
    const [modal, modalContextHolder] = Modal.useModal();
    const [playlistList, setPlaylistList] = useState<Playlist[]>([]); // 歌单列表数据
    const [categoryOptions, setCategoryOptions] = useState<{ label: string; value: string }[]>([]); // 分类列表数据
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
                const response = await apiClient.getAdminPlaylistList(queryParams);
                setPlaylistList(response.data!.list);
                setPagination({
                    current: queryParams.page,
                    pageSize: queryParams.pageSize,
                    total: response.data!.total,
                });
            } catch (err) {
                if (isAxiosError(err)) {
                    messageApi.error(
                        err.response?.data?.msg || "获取歌单列表失败，请重试"
                    );
                } else {
                    messageApi.error("获取歌单列表时发生未知错误");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [queryParams, messageApi]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await apiClient.getCategoryList();
                const options = response.data!.list.map((category: Category) => ({
                    label: category.name,
                    value: category.id,
                }));
                setCategoryOptions(options);

            } catch (err) {
                if (isAxiosError(err)) {
                    messageApi.error(
                        err.response?.data?.msg || "获取分类列表失败，请重试"
                    );
                } else {
                    console.error("获取分类列表时发生未知错误", err);
                    messageApi.error("获取分类列表时发生未知错误");
                }

            }
        }
        fetchCategories();
    }, [messageApi]);
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

    // 编辑歌单弹窗打开
    const handleEdit = (record: Playlist) => {
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

    // 打开新增歌单弹窗
    const handleAdd = () => {
        setIsEdit(false);
        setCurrentId(null);
        form.resetFields();
        setFileList([]);
        setModalVisible(true);
    };

    const handelDelete = async (ids: React.Key[]) => {
        try {
            const res = await apiClient.deletePlaylist(ids);
            messageApi.success(res.msg);
            setQueryParams((prev) => ({...prev}));
            setSelectedRowKeys([]);
        } catch (err) {
            if (isAxiosError(err)) {
                const msg = err.response?.data.msg;
                messageApi.error(msg);
                console.error(msg);
            } else {
                console.error("删除歌单失败", err);
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
                await apiClient.updatePlaylist(currentId, formData);
                messageApi.success("更新成功");
            } else {
                await apiClient.createPlaylist(formData);
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

    const columns: TableColumnsType<Playlist> = [
        {title: "ID", dataIndex: "id", key: "id", ellipsis: true, hidden: true},
        {title: "名称", dataIndex: "name", key: "name", ellipsis: true},
        {
            title: "创建者",
            dataIndex: "creator",
            key: "creator",
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
                    {status === "0" ? "正常" : "禁用"}
                </Tag>
            ),
        },
        {
            title: "可见性",
            dataIndex: "visibility",
            key: "visibility",
            render: (visibility) => (
                <Tag color={visibility === "public" ? "green" : "red"}>
                    {visibility === "public" ? "公开" : "隐藏"}
                </Tag>
            ),
        },
        {
            title: "类别",
            dataIndex: "classifications",
            key: "classifications",
            render: (classifications: string[]) => {
                const categories = classifications?.map((categoryId) => {
                    const category = categoryOptions.find(
                        (option) => option.value === categoryId
                    );
                    if (!category) return null;
                    return category.label;
                }).filter(Boolean).join(', '); // 将标签名连接成一个字符串

                return (
                    <Tag color="blue">
                        {categories}
                    </Tag>
                );
            },
        },
        {title: "歌曲数", dataIndex: "song_count", key: "song_count"},
        {title: "收藏数", dataIndex: "collect_count", key: "collect_count"},
        {title: "播放量", dataIndex: "play_count", key: "play_count"},
        // {title: "创建时间", dataIndex: "create_time", key: "create_time", ellipsis: true},
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
                                title: "删除音乐",
                                content: "你确定要删除这个歌单吗?",
                                okText: "确定",
                                cancelText: "取消",
                                onOk: () => handelDelete([record.id]),
                            });
                        },
                    }
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
                title="歌单管理"
                extra={
                    <Space>
                        <Input
                            placeholder="搜索歌单..."
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
                            添加歌单
                        </Button>
                        <Popconfirm
                            title="批量删除歌单"
                            description={`你确定要删除${selectedRowKeys.length}条歌单吗?`}
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
                    dataSource={playlistList}
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
                        expandedRowRender: (record) => {
                            const html = record.description || "";
                            return (
                                <div>
                                    <span className="font-bold">歌单简介：</span>
                                    <div
                                        dangerouslySetInnerHTML={{__html: html}}
                                    />
                                </div>
                            );
                        }
                    }}
                />

                <Modal
                    title={isEdit ? "编辑歌单" : "新增歌单"}
                    open={modalVisible}
                    onOk={handleModalOk}
                    onCancel={handleModalCancel}
                    okText="提交"
                    cancelText="取消"
                >
                    <Form form={form} layout="vertical">
                        <Form.Item
                            name="name"
                            label="歌单名称"
                            rules={[{required: true, message: "请输入名称"}]}
                        >
                            <Input placeholder="请输入名称"/>
                        </Form.Item>
                        <Form.Item
                            name="description"
                            label="描述"
                            rules={[{required: true, message: "请输入描述"}]}
                        >
                            <RichTextEditor/>
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
                                }/upload/?type=cover`}
                                onChange={handleUploadChange}
                                beforeUpload={beforeUpload}
                            >
                                <Button icon={<FolderUp size={20}/>}>点击上传</Button>
                            </Upload>
                        </Form.Item>
                        <Form.Item name="status" label="状态" rules={[{required: true, message: "请选择状态"}]}>
                            <Select
                                style={{width: 120}}
                                options={[
                                    {value: "0", label: "正常"},
                                    {value: "1", label: "禁用"},
                                ]}
                            />
                        </Form.Item>
                        <Form.Item name="visibility" label="可见性"
                                   rules={[{required: true, message: "请上选择可见性"}]}>
                            <Select
                                style={{width: 120}}
                                options={[
                                    {value: "public", label: "公开"},
                                    {value: "private", label: "隐藏"},
                                ]}
                            />
                        </Form.Item>
                        <Form.Item
                            name="classifications"
                            label="歌单分类"
                            rules={[{required: true, message: "请选择分类"}]}
                        >
                            <Select
                                mode="multiple"
                                placeholder="请选择分类"
                                showSearch
                                filterOption={false}
                                options={categoryOptions}
                            />
                        </Form.Item>
                    </Form>
                </Modal>
            </Card>
        </>
    );
}

export default PlaylistManage;
