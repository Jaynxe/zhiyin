import React, {useEffect, useRef} from "react";
import APlayer, {APlayerFixedModePlugin} from "aplayer-ts";
import "aplayer-ts/dist/APlayer.min.css";

interface APlayerTSWrapperProps {
    audioSrc: string;
    audioName?: string;
    artist?: string;
    cover?: string;
    lyric?: string;
    mode?: "mini" | "normal" | "fixed";
}

const APlayerTSWrapper: React.FC<APlayerTSWrapperProps> = ({
                                                               audioSrc,
                                                               mode = "normal",
                                                               audioName = "未知歌曲",
                                                               artist = "未知艺术家",
                                                               cover = "https://aplayer.js.org/assets/logo.png",
                                                               lyric
                                                           }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerInstance = useRef<APlayer | null>(null);
    useEffect(() => {
        if (containerRef.current) {
            // 销毁已有实例
            playerInstance.current?.destroy();
            // 初始化配置
            const config = {
                container: containerRef.current,
                mini: mode === "mini",
                mutex: true,
                lrcType: 3,
                audio: [
                    {
                        name: audioName,
                        artist,
                        url: audioSrc,
                        cover,
                        lrc: lyric,
                    },
                ],
            };

            // 仅fixed模式使用插件
            if (mode === "fixed") {
                playerInstance.current = APlayer().use(APlayerFixedModePlugin).init(config);
            } else {
                playerInstance.current = APlayer().init(config);
            }
        }

        return () => {
            playerInstance.current?.destroy();
            playerInstance.current = null;
        };
    }, [audioSrc, audioName, artist, cover, mode, lyric]);

    return <div ref={containerRef}/>;
};

export default APlayerTSWrapper;
