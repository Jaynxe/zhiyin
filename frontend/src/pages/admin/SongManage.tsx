import {apiClient} from "@/api/client";
import type {Song, PaginationState, QueryParams, Category, Language} from "@/types";
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
import {Search, FolderUp, Plus, Trash2, MoreHorizontal, UserRoundPen, FileMusic, TypeOutline} from "lucide-react";
import {fullImagePath} from "@/utils/common";
import {UPLOAD_CONFIG} from "@/config/constants";
import RichTextEditor from "@/components/common/RichTextEditor.tsx";
import ImgCrop from "antd-img-crop";
import APlayerTSWrapper from "@/components/common/APlayerTSWrapper.tsx";

function SongManage() {
    const [messageApi, contextHolder] = message.useMessage(); // 消息提示
    const [modal, modalContextHolder] = Modal.useModal();

    const [loading, setLoading] = useState(false); // table加载状态
    const [selectedRecord, setSelectedRecord] = useState<Song | null>(null); // 选中的音乐记录
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]); // 选中行的key
    const [modalVisible, setModalVisible] = useState(false);
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

    const [SongList, setSongList] = useState<Song[]>([]); // 音乐列表数据
    const [categoryOptions, setCategoryOptions] = useState<{ label: string; value: string }[]>([]);
    const [languageOptions, setLanguageOptions] = useState<{ label: string; value: string }[]>([]);
    const [fileList, setFileList] = useState<UploadFile[]>([]); // 文件列表
    const [sourceFileList, setSourceFileList] = useState<UploadFile[]>([]); // 音乐文件列表
    const [lyricFileList, setLyricFileList] = useState<UploadFile[]>([]); // 歌词文件列表

    const [currentId, setCurrentId] = useState<string | null>(null); // 当前编辑的音乐ID
    const [isEdit, setIsEdit] = useState(false); // 判断是编辑还是新增

    const [form] = Form.useForm();

    // 监听查询参数变化加载数据
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await apiClient.getSongList(queryParams);
                setSongList(response.data!.list);
                setPagination({
                    current: queryParams.page,
                    pageSize: queryParams.pageSize,
                    total: response.data!.total,
                });
            } catch (err) {
                if (isAxiosError(err)) {
                    messageApi.error(
                        err.response?.data?.msg || "获取音乐列表失败，请重试"
                    );
                } else {
                    messageApi.error("获取音乐列表时发生未知错误");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [queryParams, messageApi]);

    useEffect(() => {
        const fetchLanguage = async (keyword = "") => {
            try {
                const res = await apiClient.getLanguageList({
                    page: 1,
                    pageSize: 20,
                    keyword,
                });
                const options = res.data!.list.map((language: Language) => ({
                    label: language.name,
                    value: language.id,
                }));
                setLanguageOptions(options);
            } catch (err) {
                messageApi.error("获取语言列表失败");
                console.error(err);
            }
        };
        const fetchCategory = async (keyword = "") => {
            try {
                const res = await apiClient.getCategoryList({
                    page: 1,
                    pageSize: 20,
                    keyword,
                });
                const options = res.data!.list.map((category: Category) => ({
                    label: category.name,
                    value: category.id,
                }));
                setCategoryOptions(options);
            } catch (err) {
                messageApi.error("获取语言列表失败");
                console.error(err);
            }
        };
        fetchLanguage();
        fetchCategory();
        return () => {
            setCategoryOptions([]);
            setLanguageOptions([]);
        }
    }, [messageApi])
    const handelDelete = async (ids: React.Key[]) => {
        try {
            const res = await apiClient.deleteSong(ids);
            messageApi.success(res.msg);
            setQueryParams((prev) => ({...prev}));
            setSelectedRowKeys([]);
        } catch (err) {
            if (isAxiosError(err)) {
                const msg = err.response?.data.msg;
                messageApi.error(msg);
                console.error(msg);
            } else {
                console.error("删除音乐失败", err);
            }
        }
    };
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

    // 编辑音乐弹窗打开
    const handleEdit = (record: Song) => {
        setIsEdit(true);
        setCurrentId(record.id);
        form.setFieldsValue(record); // 填充表单

        // 填充图片
        setFileList(
            record.cover
                ? [
                    {
                        uid: "-1",
                        name: record.cover.split("/").pop() || "avatar",
                        status: "done",
                        url: fullImagePath(record.cover),
                    },
                ]
                : []
        );
        setSourceFileList(
            record.source
                ? [
                    {
                        uid: "-2",
                        name: record.source.split("/").pop() || "source",
                        status: "done",
                        url: fullImagePath(record.source),
                    },
                ]
                : []
        );
        setLyricFileList(
            record.lyric
                ? [
                    {
                        uid: "-3",
                        name: record.lyric.split("/").pop() || "lyric",
                        status: "done",
                        url: fullImagePath(record.lyric),
                    },
                ]
                : []
        )
        setModalVisible(true);
    };

    // 打开新增音乐弹窗
    const handleAdd = () => {
        setIsEdit(false);
        setCurrentId(null);
        form.resetFields();
        setFileList([]);
        setSourceFileList([]);
        setLyricFileList([]);
        setModalVisible(true);
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
                await apiClient.updateSong(currentId, formData);
                messageApi.success("更新成功");
            } else {
                await apiClient.createSong(formData);
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

    const handleSourceUploadChange = ({
                                          file,
                                          fileList,
                                      }: {
        file: UploadFile;
        fileList: UploadFile[];
    }) => {
        setSourceFileList(fileList.slice(-1));

        if (file.status === "done") {
            try {
                const path = file.response?.data?.path;
                if (typeof path === "string") {
                    form.setFieldsValue({source: path});
                    messageApi.success("音乐文件上传成功");
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


    const beforeSourceUpload = (file: File) => {
        const isAudio = UPLOAD_CONFIG.ALLOWED_AUDIO_TYPES.some(
            (type: string) => file.type === type
        )
        if (!isAudio) {
            messageApi.error(UPLOAD_CONFIG.AUDIO_TYPE_ERROR_MSG);
            return Upload.LIST_IGNORE;
        }
        const isLtMaxSize = file.size / 1024 / 1024 < UPLOAD_CONFIG.AUDIO_MAX_FILE_SIZE;
        if (!isLtMaxSize) {
            messageApi.error(UPLOAD_CONFIG.AUDIO_SIZE_ERROR_MSG);
            return Upload.LIST_IGNORE;
        }
        return true;
    };

    const handleLyricUploadChange = ({
                                         file,
                                         fileList,
                                     }: {
        file: UploadFile;
        fileList: UploadFile[];
    }) => {
        setLyricFileList(fileList.slice(-1)); // 只保留最新上传的一个歌词文件

        if (file.status === "done") {
            try {
                const path = file.response?.data?.path;
                if (typeof path === "string") {
                    form.setFieldsValue({lyric: path});
                    messageApi.success("歌词文件上传成功");
                } else {
                    messageApi.error("上传失败：无效的文件路径");
                }
            } catch (error) {
                messageApi.error("上传失败：处理响应数据时出错");
                console.error(error);
            }
        } else if (file.status === "error") {
            messageApi.error("歌词上传失败");
        }
    };

    const beforeLyricUpload = (file: File) => {
        const allowedExtension = ".lrc";

        const fileName = file.name.toLowerCase();
        const isLrc = fileName.endsWith(allowedExtension);
        if (!isLrc) {
            messageApi.error("只支持 .lrc 格式的歌词文件");
            return Upload.LIST_IGNORE;
        }

        const isLt1M = file.size / 1024 / 1024 < 1;
        if (!isLt1M) {
            messageApi.error("歌词文件大小不能超过 1MB");
            return Upload.LIST_IGNORE;
        }

        return true;
    };


    const columns: TableColumnsType<Song> = [
        {title: "ID", dataIndex: "id", key: "id", ellipsis: true, hidden: true},
        {title: "歌名", dataIndex: "title", key: "title"},
        {
            title: "歌手",
            dataIndex: "singer",
            key: "singer",
            ellipsis: true,
        },

        {
            title: "封面",
            dataIndex: "cover",
            key: "cover",
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

        {title: "播放量", dataIndex: "plays", key: "plays"},

        {
            title: "上传用户",
            dataIndex: "username",
            key: "username",
            ellipsis: true,
        },
        // {
        //     title: "专辑",
        //     dataIndex: "album",
        //     key: "album",
        //     ellipsis: true,
        // },
        // {
        //     title: "发行商",
        //     dataIndex: "issuer",
        //     key: "issuer",
        //     ellipsis: true,
        // },
        {
            title: "状态",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={status === "0" ? "green" : "red"}>
                    {status === "0" ? "上架" : "下架"}
                </Tag>
            ),
        },
        {
            title: "分类",
            dataIndex: "classification_name",
            key: "classification_name",
            render: (classification_name) => (
                <Tag color="blue">
                    {classification_name}
                </Tag>
            ),
        },
        {
            title: "语言",
            dataIndex: "language_name",
            key: "language_name",
            render: (language_name) => (
                <Tag color="pink">
                    {language_name}
                </Tag>
            ),
        },
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
                                content: "你确定要删除这首音乐吗?",
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
            {contextHolder}{modalContextHolder}
            <Card
                title="音乐管理"
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
                            添加音乐
                        </Button>
                        <Popconfirm
                            title="批量删除音乐"
                            description={`你确定要删除${selectedRowKeys.length}首音乐吗?`}
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
                    dataSource={SongList}
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
                            <div>
                                <span className="font-bold">歌曲简介：</span>
                                <div dangerouslySetInnerHTML={{__html: record.description || ""}}/>
                            </div>
                        ),
                        onExpand: (expanded, record) => {
                            if (expanded) {
                                setSelectedRecord(record);  // 设置当前播放项
                            }
                        },
                    }}

                    onChange={handleTableChange}
                />
                <Modal
                    title={isEdit ? "编辑音乐" : "新增音乐"}
                    open={modalVisible}
                    onOk={handleModalOk}
                    onCancel={handleModalCancel}
                    okText="提交"
                    cancelText="取消"
                >
                    <Form form={form} layout="vertical">
                        <Form.Item
                            name="title"
                            label="歌名"
                            rules={[{required: true, message: "请输入歌名"}]}
                        >
                            <Input placeholder="请输入歌名"/>
                        </Form.Item>

                        <Form.Item
                            name="singer"
                            label="歌手"
                            rules={[{required: true, message: "请输入歌手名"}]}
                        >
                            <Input placeholder="请输入歌手名"/>
                        </Form.Item>
                        <Form.Item
                            name="classification"
                            label="分类"
                            rules={[{required: true, message: "请选择分类"}]}
                        >
                            <Select
                                placeholder="请选择分类"
                                showSearch
                                filterOption={false}
                                options={categoryOptions}
                            />
                        </Form.Item>

                        <Form.Item
                            name="language"
                            label="语言"
                            rules={[{required: true, message: "请选择语言"}]}
                        >
                            <Select
                                placeholder="请选择语言"
                                showSearch
                                filterOption={false}
                                options={languageOptions}
                            />
                        </Form.Item>
                        <Form.Item
                            name="album"
                            label="专辑"
                        >
                            <Input placeholder="请输入专辑名"/>
                        </Form.Item>

                        <Form.Item
                            name="issuer"
                            label="发行商"
                        >
                            <Input placeholder="请输入发行商"/>
                        </Form.Item>

                        <Form.Item
                            name="status"
                            label="状态"
                            rules={[{required: true, message: "请选择状态"}]}
                        >
                            <Select
                                options={[
                                    {value: "0", label: "上架"},
                                    {value: "1", label: "下架"},
                                ]}
                            />
                        </Form.Item>

                        <Form.Item
                            name="cover"
                            label="封面图"
                            rules={[{required: !isEdit, message: "请上传封面"}]} // 新增时必传，编辑时可选
                        >
                            <ImgCrop
                                rotationSlider
                                cropShape="round"
                                showGrid
                                aspect={1}
                                modalTitle="裁剪封面"
                            >
                                <Upload
                                    name="file"
                                    listType="picture"
                                    maxCount={1}
                                    fileList={fileList}
                                    action={`${import.meta.env.VITE_API_BASE}/upload/?type=cover`}
                                    onChange={handleUploadChange}
                                    beforeUpload={beforeUpload}
                                >
                                    <Button icon={<FolderUp strokeWidth={1.5} size={20}/>}>上传封面</Button>
                                </Upload>
                            </ImgCrop>
                        </Form.Item>
                        <Form.Item
                            name="source"
                            label="上传音乐"
                            rules={[{required: !isEdit, message: "请上传音乐"}]} // 新增时必传，编辑时可选
                        >
                            <Upload
                                name="file"
                                listType="text"
                                maxCount={1}
                                fileList={sourceFileList}
                                action={`${import.meta.env.VITE_API_BASE}/upload/?type=source`}
                                onChange={handleSourceUploadChange}
                                beforeUpload={beforeSourceUpload}
                            >
                                <Button icon={<FileMusic strokeWidth={1.5} size={20}/>}>上传音乐</Button>
                            </Upload>
                        </Form.Item>
                        <Form.Item
                            name="lyric"
                            label="上传歌词"
                        >
                            <Upload
                                name="file"
                                listType="text"
                                maxCount={1}
                                fileList={lyricFileList}
                                action={`${import.meta.env.VITE_API_BASE}/upload/?type=lyric`}
                                onChange={handleLyricUploadChange}
                                beforeUpload={beforeLyricUpload}
                            >
                                <Button icon={<TypeOutline strokeWidth={1.5} size={20}/>}>上传歌词</Button>
                            </Upload>
                        </Form.Item>
                        <Form.Item
                            name="description"
                            label="描述"
                        >
                            <RichTextEditor uploadType="cover"/>
                        </Form.Item>
                    </Form>
                </Modal>
            </Card>
            {selectedRecord && (
                <APlayerTSWrapper
                    key={selectedRecord.id} // 确保切换歌曲时重新渲染播放器
                    mode="fixed"
                    audioSrc={fullImagePath(selectedRecord.source)}
                    audioName={selectedRecord.title || "未知歌曲"}
                    artist={selectedRecord.singer || "未知艺术家"}
                    {...(selectedRecord.lyric ? {lyric: fullImagePath(selectedRecord.lyric)} : {})}
                    cover={fullImagePath(selectedRecord.cover) || "https://aplayer.js.org/assets/logo.png"}
                />
            )}

        </>
    );
}

export default SongManage;
