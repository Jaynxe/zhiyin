import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { Tabs, Dropdown } from "antd";
import type { MenuProps } from "antd";
import {
  X,
  ArrowLeftToLine,
  ArrowRightToLine,
  SquareSlash,
  Trash2,
} from "lucide-react";

interface TabType {
  key: string;
  label: string;
  closable?: boolean;
}

// 路由路径到标签的映射
const titleMap: Record<string, string> = {
  dashboard: "仪表盘",
  user: "用户管理",
  songs: "歌曲管理",
  playlist: "歌单管理",
  category: "分类管理",
  language: "语言管理",
  comment: "评论管理",
  advertise: "广告管理",
  loginLog: "登录日志",
  notice: "通知管理",
  feedback: "反馈管理",
  systemInfo: "系统信息",
};

const defaultTabs: TabType[] = [
  { key: "/admin", label: "仪表盘", closable: false },
];

const AdminTabs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState<string>(location.pathname);
  const [items, setItems] = useState<TabType[]>(defaultTabs);

  // 获取标签文本
  const getTabLabel = (path: string): string => {
    // 处理 /admin 路径
    if (path === "/admin") return "仪表盘";
    const key = path.replace("/admin/", "");
    return titleMap[key] || "新标签页";
  };

  const saveTabsToSessionStorage = (tabs: TabType[]) => {
    sessionStorage.setItem("tabs", JSON.stringify(tabs));
  };

  // 初始化时加载保存的tabs
  useEffect(() => {
    const savedTabs = sessionStorage.getItem("tabs");
    if (savedTabs) {
      const parsedTabs = JSON.parse(savedTabs);
      // 确保至少有一个默认tab
      if (!parsedTabs.find((tab: TabType) => tab.key === "/admin")) {
        parsedTabs.unshift(defaultTabs[0]);
      }
      setItems(parsedTabs);
    }
  }, []);

  // 处理路由变化
  useEffect(() => {
    const currentPath = location.pathname;
    // 如果是 /admin/dashboard，直接使用 /admin 作为key
    const tabKey = currentPath === "/admin/dashboard" ? "/admin" : currentPath;

    setItems((prevItems) => {
      // 检查是否已存在该tab
      const existingTab = prevItems.find((item) => item.key === tabKey);

      if (!existingTab && tabKey !== activeKey) {
        // 如果是仪表盘路径，确保只有一个仪表盘tab
        if (tabKey === "/admin") {
          const hasDashboard = prevItems.some((item) => item.key === "/admin");
          if (hasDashboard) {
            return prevItems;
          }
        }
        const newItems = [
          ...prevItems,
          {
            key: tabKey,
            label: getTabLabel(tabKey),
            closable: tabKey !== "/admin",
          },
        ];
        saveTabsToSessionStorage(newItems);
        return newItems;
      }
      return prevItems;
    });

    if (tabKey !== activeKey) {
      setActiveKey(tabKey);
    }
  }, [location.pathname, activeKey]);

  const removeTab = (targetKey: string) => {
    setItems((prevItems) => {
      const index = prevItems.findIndex((item) => item.key === targetKey);
      if (index === -1 || !prevItems[index].closable) return prevItems;

      const newItems = prevItems.filter((item) => item.key !== targetKey);
      saveTabsToSessionStorage(newItems);

      if (activeKey === targetKey) {
        const lastTab = newItems[newItems.length - 1];
        // 如果删除的是最后一个tab，直接跳转到仪表盘
        if (newItems.length === 1) {
          navigate("/admin");
          return newItems;
        }
        navigate(lastTab.key);
      }
      return newItems;
    });
  };

  const closeLeftTabs = (currentKey: string) => {
    const currentIndex = items.findIndex((item) => item.key === currentKey);
    if (currentIndex <= 0) return;

    const newItems = items.filter(
      (item, index) => index >= currentIndex || !item.closable
    );
    setItems(newItems);
    saveTabsToSessionStorage(newItems);

    // 如果当前激活的标签被关闭了，跳转到最后一个标签
    if (!newItems.some((item) => item.key === activeKey)) {
      const lastTab = newItems[newItems.length - 1];
      navigate(lastTab.key);
    }
  };

  const closeRightTabs = (currentKey: string) => {
    const currentIndex = items.findIndex((item) => item.key === currentKey);
    if (currentIndex >= items.length - 1) return;

    const newItems = items.filter(
      (item, index) => index <= currentIndex || !item.closable
    );
    setItems(newItems);
    saveTabsToSessionStorage(newItems);

    // 如果当前激活的标签被关闭了，跳转到最后一个标签
    if (!newItems.some((item) => item.key === activeKey)) {
      const lastTab = newItems[newItems.length - 1];
      navigate(lastTab.key);
    }
  };

  const closeOtherTabs = (currentKey: string) => {
    const newItems = items.filter(
      (item) => item.key === currentKey || !item.closable
    );
    setItems(newItems);
    if (!newItems.some((item) => item.key === activeKey && !item.closable)) {
      navigate(currentKey);
    }
    saveTabsToSessionStorage(newItems);
  };

  const removeAllTabs = () => {
    const newItems = items.filter((item) => !item.closable);
    setItems(newItems);
    navigate(newItems[0].key);
    saveTabsToSessionStorage(newItems);
  };

  const getTabMenuItems = (key: string): MenuProps["items"] => [
    {
      key: "close",
      label: "关闭",
      icon: <X size={14} />,
      onClick: () => removeTab(key),
    },
    {
      key: "closeLeft",
      label: "关闭左边",
      icon: <ArrowLeftToLine size={14} />,
      disabled: items.findIndex((item) => item.key === key) === 0,
      onClick: () => closeLeftTabs(key),
    },
    {
      key: "closeRight",
      label: "关闭右边",
      icon: <ArrowRightToLine size={14} />,
      disabled:
        items.findIndex((item) => item.key === key) === items.length - 1,
      onClick: () => closeRightTabs(key),
    },
    {
      key: "closeOthers",
      label: "关闭其他",
      icon: <SquareSlash size={14} />,
      onClick: () => closeOtherTabs(key),
    },
    {
      type: "divider",
    },
    {
      key: "closeAll",
      label: "关闭全部",
      icon: <Trash2 size={14} />,
      onClick: () => removeAllTabs(),
    },
  ];

  return (
    <div>
      <Tabs
        type="editable-card"
        activeKey={activeKey}
        size="small"
        animated
        items={items}
        onChange={(key) => {
          setActiveKey(key);
          navigate(key);
        }}
        onEdit={(targetKey) => {
          removeTab(targetKey as string);
        }}
        hideAdd
        tabBarStyle={{
          margin: 0,
        }}
        renderTabBar={(tabBarProps, DefaultTabBar) => (
          <DefaultTabBar {...tabBarProps}>
            {(node) => (
              <Dropdown
                menu={{ items: getTabMenuItems(node.key as string) }}
                trigger={["contextMenu"]}
              >
                <div>{node}</div>
              </Dropdown>
            )}
          </DefaultTabBar>
        )}
      />
    </div>
  );
};

export default AdminTabs;
