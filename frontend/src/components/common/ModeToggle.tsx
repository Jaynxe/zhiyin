import {Laptop, Moon, Sun} from "lucide-react";
import {Button, Dropdown} from "antd";
import type {MenuProps} from "antd";
import {useTheme} from "@/components/common/ThemeProvider.tsx";

function ModeToggle() {
    const {setTheme} = useTheme();

    const items: MenuProps["items"] = [
        {
            key: "light",
            label: "浅色",
            icon: <Sun size={20}/>,
            onClick: () => setTheme("light"),
        },
        {
            key: "dark",
            label: "深色",
            icon: <Moon size={20}/>,
            onClick: () => setTheme("dark"),
        },
        {
            key: "system",
            label: "跟随系统",
            icon: <Laptop size={20}/>,
            onClick: () => setTheme("system"),
        },
    ];

    return (
        <Dropdown menu={{items}} placement="bottomRight">
            <Button
                type="default"
                className="flex items-center justify-center"
                icon={
                    <div className="flex items-center justify-center">
                        <Sun
                            className="transition-all duration-300 transform
                         dark:opacity-0 dark:scale-75
                         opacity-100 scale-100"
                            size={22}
                        />
                        <Moon
                            className="transition-all duration-300 transform
                         -ml-5
                         dark:opacity-100 dark:scale-100
                         opacity-0 scale-75"
                            size={22}
                        />
                    </div>
                }
            />
        </Dropdown>
    );
}

export default ModeToggle;
