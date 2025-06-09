import React, {useEffect, useRef, useState} from "react";

interface LyricLine {
    time: number;
    text: string;
}

interface FullscreenLyricProps {
    cover: string;
    title: string;
    artist: string;
    lyricUrl: string;
    currentTime: number;
    onClose: () => void;
}

const parseLRC = (lrcText: string): LyricLine[] => {
    const lines = lrcText.split("\n");
    const result: LyricLine[] = [];
    const timeExp = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/;

    for (const line of lines) {
        const match = timeExp.exec(line);
        if (!match) continue;
        const min = parseInt(match[1]);
        const sec = parseInt(match[2]);
        const msec = match[3] ? parseInt(match[3].padEnd(3, "0")) : 0;
        const time = min * 60 + sec + msec / 1000;
        const text = line.replace(timeExp, "").trim();
        result.push({time, text});
    }

    return result.sort((a, b) => a.time - b.time);
};

const FullscreenLyric: React.FC<FullscreenLyricProps> = ({
                                                             cover,
                                                             title,
                                                             artist,
                                                             lyricUrl,
                                                             currentTime,
                                                             onClose,
                                                         }) => {
    const [lyrics, setLyrics] = useState<LyricLine[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // 获取歌词数据
    useEffect(() => {
        if (!lyricUrl) return;
        fetch(lyricUrl)
            .then((res) => res.text())
            .then((text) => setLyrics(parseLRC(text)))
            .catch(() => setLyrics([{time: 0, text: "无法加载歌词"}]));
    }, [lyricUrl]);

    // 计算当前应高亮的歌词行
    useEffect(() => {
        if (!lyrics.length) return;

        // 修正的查找逻辑：找到最后一个时间小于currentTime的歌词行
        let index = 0;
        for (let i = lyrics.length - 1; i >= 0; i--) {
            if (currentTime >= lyrics[i].time) {
                index = i;
                break;
            }
        }
        setActiveIndex(index);
    }, [currentTime, lyrics]);

    // 自动滚动到当前歌词
    useEffect(() => {
        const container = containerRef.current;
        if (!container || activeIndex === -1) return;

        // 使用更可靠的DOM查询方式
        const lyricContainer = container.firstChild as HTMLElement;
        const activeLine = lyricContainer?.children[activeIndex] as HTMLElement;

        if (activeLine) {
            // 精确计算滚动位置
            const containerHeight = container.clientHeight;
            const lineTop = activeLine.offsetTop;
            const lineHeight = activeLine.offsetHeight;

            // 添加防抖避免频繁滚动
            const scrollTimer = setTimeout(() => {
                container.scrollTo({
                    top: lineTop - (containerHeight / 2) + (lineHeight / 2),
                    behavior: "smooth"
                });
            }, 100);

            return () => clearTimeout(scrollTimer);
        }
    }, [activeIndex]);

    return (
        <div
            className="fixed inset-0 z-50 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-zinc-900 dark:to-zinc-800 text-gray-900 dark:text-gray-100">
            {/* 顶部返回按钮 */}
            <div className="absolute top-6 left-6">
                <button
                    onClick={onClose}
                    className="cursor-pointer"
                    aria-label="关闭歌词"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24"
                         stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                    </svg>
                </button>
            </div>

            {/* 主内容区域 */}
            <div className="h-full flex flex-col items-center justify-center">
                <div className="w-full flex max-w-5xl">
                    {/* 左侧封面 */}
                    <div className="flex flex-col items-center justify-center rounded-2xl">
                        <img
                            src={cover}
                            alt="专辑封面"
                            className="w-60 h-60 rounded-lg object-cover mb-5"
                        />
                        <div className="text-center">
                            <h2 className="text-2xl font-bold line-clamp-1">{title}</h2>
                            <p className="text-gray-600 dark:text-gray-300 mt-2">{artist}</p>
                        </div>
                    </div>

                    {/* 右侧歌词区域 */}
                    <div className="flex-1 flex flex-col">
                        <div className="flex-1">
                            <div
                                ref={containerRef}
                                className="h-[500px] overflow-y-auto"
                                style={{
                                    scrollbarWidth:"auto", // Firefox
                                    scrollbarColor: "#444 rgba(0, 0, 0, 0)", // Firefox
                                }}
                            >
                                <div className="flex flex-col items-center space-y-3">
                                    {lyrics.length > 0 ? (
                                        lyrics.map((line, index) => (
                                            <div
                                                key={index}
                                                className={`text-center py-2 px-4 transition-all duration-300 ${
                                                    index === activeIndex
                                                        ? "text-indigo-600 dark:text-indigo-400 font-bold text-lg"
                                                        : "text-gray-600 dark:text-gray-400 opacity-80"
                                                }`}
                                            >
                                                {line.text || <span className="opacity-50">♪</span>}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-gray-500 dark:text-gray-400 py-10 text-center">
                                            正在加载歌词...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FullscreenLyric;