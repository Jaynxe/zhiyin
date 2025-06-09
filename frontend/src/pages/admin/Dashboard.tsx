import React, {useEffect, useRef, useState} from "react";
import {Col, Row, Spin} from "antd";
import type {DashboardData} from "@/types";
import {apiClient} from "@/api/client"; // 假设你已经配置好了 axios 实例
import {ListMusic, Users, PlayCircle, MessageCircle} from "lucide-react"
import * as echarts from "echarts/core";
import {LineChart, BarChart, PieChart} from "echarts/charts";
import {
    GridComponent,
    TooltipComponent,
    LegendComponent,
    TitleComponent,
} from "echarts/components";
import {CanvasRenderer} from "echarts/renderers";
import {UniversalTransition} from "echarts/features";

echarts.use([
    GridComponent,
    TooltipComponent,
    LegendComponent,
    TitleComponent,
    LineChart,
    BarChart,
    PieChart,
    CanvasRenderer,
    UniversalTransition,
]);


const Dashboard: React.FC = () => {
        const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            const fetchDashboard = async () => {
                try {
                    const res = await apiClient.dashboardInfo();
                    setDashboardData(res.data);
                } catch (error) {
                    console.error("获取仪表盘数据失败", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchDashboard();
        }, []);

        const lineChartRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
                if (!lineChartRef.current) return;

                const chart = echarts.init(lineChartRef.current);

                const option = {
                    title: {
                        text: "近一周用户、歌曲新增数量",
                        left: "center",
                        textStyle: {
                            color: "#888",
                            fontSize: 16,
                        },
                    },
                    tooltip: {
                        trigger: "axis",
                    },
                    legend: {
                        data: ["用户新增", "歌曲新增"],
                        top: 25,
                        textStyle: {
                            color: "#888",
                        }
                    },
                    grid: {
                        left: "3%",
                        right: "4%",
                        bottom: "4%",
                        containLabel: true,
                    },
                    xAxis: {
                        type: "category",
                        name: "时间",
                        axisTick: {
                            show: true,         // 可选：隐藏刻度线
                        },
                        axisLine: {
                            show: true,
                            lineStyle: {
                                color: '#888',     // 轴线颜色
                                width: 0.5,          // 轴线宽度
                                type: 'solid',     // 线型: 'solid', 'dashed', 'dotted'
                            },
                        },
                        boundaryGap: false,
                        data: dashboardData?.user_growth.map((item) => item.date),
                    },
                    yAxis: {
                        type: "value",
                        name: "数量",
                        axisLine: {
                            show: true,
                            lineStyle: {
                                color: '#888',     // 轴线颜色
                                width: 0.5,          // 轴线宽度
                                type: 'solid',     // 线型: 'solid', 'dashed', 'dotted'
                            },
                        },
                        axisTick: {
                            show: true,         // 可选：隐藏刻度线
                        },
                        splitLine: {
                            lineStyle: {
                                width: 0.3,        // 网格线宽度
                                color: '#888',     // 网格线颜色
                                type: 'dashed',    // 线型:'solid', 'dashed', 'dotted'
                            },
                        },
                    },
                    series: [
                        {
                            name: "用户新增",
                            type: "line",
                            smooth: true,
                            areaStyle: {},
                            data: dashboardData?.user_growth.map((item) => item.count),
                            itemStyle: {
                                color: "#34D399",
                            },
                        },
                        {
                            name: "歌曲新增",
                            type: "line",
                            smooth: true,
                            areaStyle: {},
                            data: dashboardData?.song_growth.map((item) => item.count),
                            itemStyle: {
                                color: "#4f46e5",
                            },
                        },
                    ],
                };

                chart.setOption(option);

                // 响应式处理
                window.addEventListener("resize", () => chart.resize());

                return () => {
                    window.removeEventListener("resize", () => chart.resize());
                    chart.dispose();
                };
            }, [dashboardData?.song_growth, dashboardData?.user_growth]
        );

        const barChartRef = useRef<HTMLDivElement>(null);
        useEffect(() => {
            if (!barChartRef.current) return;

            const chart = echarts.init(barChartRef.current);
            const option = {
                title: {
                    text: "热门歌曲播放排行",
                    left: "center",
                    textStyle: {
                        color: "#888",
                        fontSize: 16,
                    },
                },
                tooltip: {
                    trigger: "axis",
                    axisPointer: {type: "shadow"},
                },
                grid: {
                    left: "5%",
                    right: "13%",
                    bottom: "8%",
                    containLabel: true,
                },
                xAxis: {
                    name: "歌曲名称",
                    type: "category",
                    nameLocation: 'end',
                    data: dashboardData?.order_rank_data.map((item) => item.title),
                    axisLine: {
                        show: true,
                        lineStyle: {
                            color: '#888',     // 轴线颜色
                            width: 0.5,        // 轴线宽度
                            type: 'solid',     // 线型: 'solid', 'dashed', 'dotted'
                        },
                    },
                    axisLabel: { // x轴标签样式
                        color: '#888',
                        fontSize: 12,
                        // rotate: 30,
                        formatter: (value: string) =>
                            value.length > 8 ? value.slice(0, 8) + "..." : value,
                    },
                    axisTick: {
                        alignWithLabel: true
                    }
                },
                yAxis: {
                    name: "播放量",
                    type: "value",
                    axisLine: {
                        show: true,
                        lineStyle: {
                            color: '#888',     // 轴线颜色
                            width: 0.5,         // 轴线宽度
                            type: 'solid',     // 线型: 'solid', 'dashed', 'dotted'
                        },
                    },
                    splitLine: {
                        lineStyle: {
                            color: "#888",
                            type: "dashed",
                            width: 0.3,
                        },
                    },
                    axisTick: {
                        show: true,         // 可选：隐藏刻度线
                    }
                },
                series: [
                    {
                        name: "播放量",
                        type: "bar",
                        data: dashboardData?.order_rank_data.map((item) => item.count),
                        itemStyle: {
                            // color: "#4f46e5",
                            borderRadius: [6, 6, 0, 0],
                        },
                        barWidth: 24,
                    },
                ],
            };


            chart.setOption(option);
            window.addEventListener("resize", () => chart.resize());

            return () => {
                window.removeEventListener("resize", () => chart.resize());
                chart.dispose();
            };
        }, [dashboardData?.order_rank_data]);

        const pieChartRef = useRef<HTMLDivElement>(null);
        useEffect(() => {
            if (!pieChartRef.current) return;

            const chart = echarts.init(pieChartRef.current);

            const option = {
                title: {
                    text: "歌曲分类分布",
                    left: "center",
                    textStyle: {
                        color: "#888",
                        fontSize: 16,
                    },
                },
                tooltip: {
                    trigger: 'item',
                    formatter: '{a} <br/>{b}: {c} ({d}%)',
                },

                legend: {
                    orient: 'vertical',
                    right: 10,
                    top: 'center',
                    data: dashboardData?.classification_rank_data.map((item) => item.name),
                    textStyle: {
                        color: '#666',
                    },
                },
                series: [
                    {
                        name: '分类占比',
                        type: 'pie',
                        radius: ['30%', '70%'],
                        avoidLabelOverlap: false,
                        itemStyle: {
                            borderRadius: 10,
                            borderColor: '#fff',
                            borderWidth: 0.5,
                        },
                        label: {
                            show: false,
                            position: 'center',
                        },
                        emphasis: {
                            label: {
                                show: true,
                                fontSize: '20',
                                fontWeight: 'bold',
                            },
                        },
                        labelLine: {
                            show: false,
                        },
                        data: dashboardData?.classification_rank_data.map((item) => ({
                            value: item.count,
                            name: item.name,
                        })),
                    },
                ],
            };

            chart.setOption(option);
            window.addEventListener("resize", () => chart.resize());
            return () => {
                window.removeEventListener("resize", () => chart.resize());
                chart.dispose();
            };
        }, [dashboardData?.classification_rank_data]);

        if (loading) {
            return (
                <div className="flex justify-center items-center h-96">
                    <Spin size="large"/>
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-4">
                <Row gutter={16}>
                    <Col span={6}>
                        {/* 音乐总数 */}
                        <div
                            className=" p-5 bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-[#1a1a2e] dark:to-[#141414] rounded-2xl shadow-xs flex items-center space-x-4">
                            <div className="bg-indigo-100 dark:bg-indigo-500 p-3 rounded-full">
                                <ListMusic className="text-indigo-600 dark:text-white" size={24}/>
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">音乐总数</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData?.song_count}</p>
                            </div>
                        </div>
                    </Col>

                    {/* 总用户数 */}
                    <Col span={6}>
                        <div
                            className="p-5 bg-gradient-to-br from-green-100 to-green-50 dark:from-[#1e2b1f] dark:to-[#141414] rounded-2xl shadow-xs flex items-center space-x-4">
                            <div className="bg-green-100 dark:bg-green-500 p-3 rounded-full">
                                <Users className="text-green-600 dark:text-white" size={24}/>
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">用户总数</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData?.user_count}</p>
                            </div>
                        </div>
                    </Col>

                    {/* 总播放量 */}
                    <Col span={6}>
                        <div
                            className="p-5 bg-gradient-to-br from-yellow-100 to-yellow-50 dark:from-[#2e2b1a] dark:to-[#141414] rounded-2xl shadow-xs flex items-center space-x-4">
                            <div className="bg-yellow-100 dark:bg-yellow-500 p-3 rounded-full">
                                <PlayCircle className="text-yellow-600 dark:text-white" size={24}/>
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">总播放量</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData?.total_plays}</p>
                            </div>
                        </div>
                    </Col>

                    {/* 总评论数 */}
                    <Col span={6}>
                        <div
                            className="p-5 bg-gradient-to-br from-pink-100 to-pink-50 dark:from-[#2e1a2b] dark:to-[#141414] rounded-2xl shadow-xs flex items-center space-x-4">
                            <div className="bg-pink-100 dark:bg-pink-500 p-3 rounded-full">
                                <MessageCircle className="text-pink-600 dark:text-white" size={24}/>
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">总评论数</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData?.comment_count}</p>
                            </div>
                        </div>
                    </Col>
                </Row>

                {/* 后续可以加折线图和排行图表等 */}
                {/* 折线图 */}
                <div
                    ref={lineChartRef}
                    className="w-full h-96 p-2 bg-white dark:bg-[#181818] rounded-xl shadow-xs"
                />
                {/* 条形图*/}
                <div className="flex gap-4">
                    <div
                        ref={barChartRef}
                        className="w-1/2 h-96 pt-2 bg-white dark:bg-[#181818] rounded-xl shadow-xs"
                    />
                    <div
                        ref={pieChartRef}
                        className="w-1/2 h-96 pt-2 bg-white dark:bg-[#181818] rounded-xl shadow-xs"
                    />
                </div>
            </div>
        );
    }
;

export default Dashboard;
