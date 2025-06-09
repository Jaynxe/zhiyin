import {apiClient} from "@/api/client";
import type {LoginLog, PaginationState, QueryParams} from "@/types";
import {
    Button,
    Card,
    Input,
    message,
    Popconfirm,
    Space,
    Table,
    type TableColumnsType,
    type TablePaginationConfig,
} from "antd";
import {isAxiosError} from "axios";
import {Search, Trash2} from "lucide-react";
import React, {useEffect, useState} from "react";

function LoginLogManage() {
    const [messageApi, contextHolder] = message.useMessage(); // 消息提示
    const [keyword, setKeyword] = useState(""); // 搜索关键词
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]); // 选中行的key
    const [loading, setLoading] = useState(false);
    const [loginLogList, setLoginLogList] = useState<LoginLog[]>([]);
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
    // 监听查询参数变化加载数据
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await apiClient.getLoginLogList(queryParams);
                setLoginLogList(response.data!.list);
                setPagination({
                    current: queryParams.page,
                    pageSize: queryParams.pageSize,
                    total: response.data!.total,
                });
            } catch (err) {
                if (isAxiosError(err)) {
                    messageApi.error(
                        err.response?.data?.msg || "获取登录日志失败，请重试"
                    );
                } else {
                    messageApi.error("获取登录日志时发生未知错误");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [queryParams, messageApi]);

    const handelDelete = async (ids: React.Key[]) => {
        try {
            const res = await apiClient.deleteLoginLog(ids);
            messageApi.success(res.msg);
            setQueryParams((prev) => ({...prev}));
            setSelectedRowKeys([]);
        } catch (err) {
            if (isAxiosError(err)) {
                const msg = err.response?.data.msg;
                messageApi.error(msg);
                console.error(msg);
            } else {
                console.error("删除日志失败", err);
            }
        }
    };
    const columns: TableColumnsType<LoginLog> = [
        {title: "ID", dataIndex: "id", key: "id", ellipsis: true, hidden: true},
        {title: "用户名", dataIndex: "username", key: "username"},
        {title: "IP地址", dataIndex: "ip", key: "ip", ellipsis: true},

        {title: "登录时间", dataIndex: "log_time", key: "log_time"},
        {
            title: "操作",
            key: "action",
            width: 200,
            render: (_, record) => (
                <Space>
                    <Popconfirm
                        title="删除日志"
                        description="你确定要删除这条日志吗?"
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
                title="登录日志管理"
                extra={
                    <Space>
                        <Input
                            placeholder="搜索用户名"
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
                            title="批量删除日志"
                            description={`你确定要删除${selectedRowKeys.length}条日志吗?`}
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
                    dataSource={loginLogList}
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
            </Card>
        </>
    );
}

export default LoginLogManage;
