import { Card, Skeleton } from "antd";

const SystemInfoSkeleton = () => {
  return (
    <div className="space-y-6">
      <Card title="系统概览">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500 mb-2">CPU 使用率</div>
            <Skeleton.Input active block />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-2">内存使用率</div>
            <Skeleton.Input active block />
          </div>
        </div>
      </Card>

      <Card title="系统信息">
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index}>
              <Skeleton.Input active block />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default SystemInfoSkeleton;
