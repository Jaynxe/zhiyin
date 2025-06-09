import React, {useEffect, useState, useCallback} from 'react';
import {Tooltip, Button} from 'antd';
import {Expand, Shrink} from 'lucide-react';

type Props = {
    variant?: 'text' | 'link' | 'default' | 'primary' | 'dashed'
};

// 类型安全的全屏API声明
interface ExtendedDocument extends Document {
    webkitFullscreenElement?: Element | null
    mozFullScreenElement?: Element | null
    msFullscreenElement?: Element | null
    webkitExitFullscreen?: () => Promise<void>
    mozCancelFullScreen?: () => Promise<void>
    msExitFullscreen?: () => Promise<void>
}

interface ExtendedHTMLElement extends HTMLElement {
    webkitRequestFullScreen?: () => Promise<void>
    mozRequestFullScreen?: () => Promise<void>
    msRequestFullscreen?: () => Promise<void>
}

const FullscreenToggle: React.FC<Props> = ({variant = 'default'}) => {
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    const updateFullscreenStatus = useCallback(() => {
        const doc: ExtendedDocument = document;
        setIsFullscreen(
            !!(
                doc.fullscreenElement ||
                doc.webkitFullscreenElement ||
                doc.mozFullScreenElement ||
                doc.msFullscreenElement
            )
        );
    }, []);

    const toggleFullScreen = async () => {
        const doc: ExtendedDocument = document;
        const docEl: ExtendedHTMLElement = document.documentElement;

        try {
            if (isFullscreen) {
                await (
                    doc.exitFullscreen?.() ||
                    doc.webkitExitFullscreen?.() ||
                    doc.mozCancelFullScreen?.() ||
                    doc.msExitFullscreen?.()
                );
            } else {
                await (
                    docEl.requestFullscreen?.() ||
                    docEl.webkitRequestFullScreen?.() ||
                    docEl.mozRequestFullScreen?.() ||
                    docEl.msRequestFullscreen?.()
                );
            }
        } catch (err) {
            console.error('全屏操作失败:', err);
        }
    };

    useEffect(() => {
        const events = [
            'fullscreenchange',
            'webkitfullscreenchange',
            'mozfullscreenchange',
            'MSFullscreenChange',
        ];
        events.forEach((event) =>
            document.addEventListener(event, updateFullscreenStatus)
        );
        updateFullscreenStatus(); // 初始化状态

        return () => {
            events.forEach((event) =>
                document.removeEventListener(event, updateFullscreenStatus)
            );
        };
    }, [updateFullscreenStatus]);

    return (
        <Tooltip title={isFullscreen ? '退出全屏' : '进入全屏'}>
            <Button
                type={variant}
                aria-label={isFullscreen ? '退出全屏' : '进入全屏'}
                onClick={toggleFullScreen}
                icon={isFullscreen ? <Shrink strokeWidth={1.5} size={20}/> : <Expand strokeWidth={1.5} size={20}/>}
            />
        </Tooltip>
    );
};

export default FullscreenToggle;
