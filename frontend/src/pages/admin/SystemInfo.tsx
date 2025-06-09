import { apiClient } from "@/api/client";
import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { Descriptions, Card, Progress, message } from "antd";
import SystemInfoSkeleton from "@/components/admin/Skeleton/SystemInfoSkeleton";
import type { SystemInfo } from "@/types";

function SystemInfoContent() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.systemInfo();
        setSystemInfo(response.data);
      } catch (err) {
        if (isAxiosError(err)) {
          const msg = err.response?.data?.msg || "获取系统信息失败，请重试";
          message.error(msg);
        } else {
          message.error("获取系统信息时发生未知错误");
          console.error("Unexpected error:", err);
        }
      }
    };
    fetchData();
  }, []);

  if (!systemInfo) {
    return <SystemInfoSkeleton />;
  }

  return (
    <div className="space-y-6">
      <Card title="系统概览">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500 mb-2">CPU 使用率</div>
            <Progress percent={systemInfo.cpuLoad} status="active" />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-2">内存使用率</div>
            <Progress percent={systemInfo.memoryPercent} status="active" />
          </div>
        </div>
      </Card>

      <Card title="系统信息">
        <Descriptions column={2}>
          <Descriptions.Item label="系统名称">
            {systemInfo.sysName}
          </Descriptions.Item>
          <Descriptions.Item label="版本">
            {systemInfo.versionName}
          </Descriptions.Item>
          <Descriptions.Item label="操作系统">
            {systemInfo.osName}
          </Descriptions.Item>
          <Descriptions.Item label="系统架构">
            {systemInfo.osBuild}
          </Descriptions.Item>
          <Descriptions.Item label="平台">
            {systemInfo.platform}
          </Descriptions.Item>
          <Descriptions.Item label="处理器">
            {systemInfo.processor}
          </Descriptions.Item>
          <Descriptions.Item label="CPU核心数">
            {systemInfo.cpuCount}
          </Descriptions.Item>
          <Descriptions.Item label="内存总量">
            {systemInfo.memoryTotalGB.toFixed(2)} GB
          </Descriptions.Item>
          <Descriptions.Item label="已用内存">
            {systemInfo.memoryUsedGB.toFixed(2)} GB
          </Descriptions.Item>
          <Descriptions.Item label="Python版本">
            {systemInfo.pyVersion}
          </Descriptions.Item>
          <Descriptions.Item label="时区">
            {systemInfo.timezone}
          </Descriptions.Item>
          <Descriptions.Item label="语言">
            {systemInfo.locale}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}

export default function SystemInfo() {
  return <SystemInfoContent />;
}
