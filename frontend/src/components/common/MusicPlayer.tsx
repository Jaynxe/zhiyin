import React, {useState} from "react";
import {Play, Pause, SkipBack, SkipForward, Undo2, Redo2, Volume2, Repeat, List, Heart} from "lucide-react";
import {Popover, Select, Slider} from "antd";
import FullscreenLyric from "@/components/common/FullscreenLyric.tsx";
import {AnimatePresence, motion} from "framer-motion";
import useMusicPlayer from "@/hooks/useAudio.ts"; // 导入 hook

const {Option} = Select;

interface MusicPlayerProps {
    title: string;
    artist: string;
    cover: string;
    audioUrl: string;
    lyricUrl: string;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({title, artist, cover, audioUrl, lyricUrl}) => {
    const [showLyrics, setShowLyrics] = useState(false);
    const [volume, setVolume] = useState(1);
    const [playbackRate, setPlaybackRate] = useState(1);

    const {
        playing,
        progress,
        duration,
        togglePlay,
        skipTime,
        formatTime,
        handleSeek,
    } = useMusicPlayer(audioUrl, volume, playbackRate);

    return (
        <>
            <AnimatePresence>
                {showLyrics && (
                    <motion.div
                        initial={{y: "100%"}}
                        animate={{y: 0}}
                        exit={{y: "100%"}}
                        transition={{type: "keyframes",}}
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: "100%",
                            // 减去播放器高度（假设播放器高度约为80px）
                            height: "calc(100% - 80px)",
                            zIndex: 10,
                        }}
                        className="dark:bg-zinc-900/95 backdrop-blur-sm"
                    >
                        <FullscreenLyric
                            cover={cover}
                            title={title}
                            artist={artist}
                            lyricUrl={lyricUrl}
                            currentTime={progress}
                            onClose={() => setShowLyrics(false)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div
                className="w-full fixed bottom-0 left-0 z-50 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-gray-700 p-4">
                {/* ✅ 顶部进度条（可点击） */}
                <div
                    onClick={handleSeek}
                    className="absolute top-0 left-0 w-full h-1 hover:h-1.5  bg-gray-300 dark:bg-zinc-700 overflow-hidden cursor-pointer"
                >
                    <div
                        className="h-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-300"
                        style={{width: `${(progress / duration) * 100}%`}}
                    />
                </div>

                <div className="flex items-center justify-between gap-4">
                    {/* 左侧歌曲信息 */}
                    <div className="flex items-center gap-4">
                        <img src={cover} onClick={() => setShowLyrics((prev) => !prev)} alt="cover"
                             className="w-12 h-12 rounded-md object-cover cursor-pointer"/>
                        <div>

                            <div className="font-semibold text-base text-black dark:text-white">
                                {title}-<span className="text-sm text-gray-500 dark:text-zinc-400">{artist}</span>
                            </div>
                            <div className="text-xs mt-1 text-gray-400">
                                {formatTime(progress)} / {formatTime(duration)}
                            </div>
                        </div>
                    </div>

                    {/* 中间控制区 */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-6">
                            <button className="cursor-pointer group" title="上一首">
                                <SkipBack
                                    className="text-gray-400 group-hover:text-indigo-600 dark:text-gray-500 dark:group-hover:text-indigo-400"
                                    size={28}
                                    fill="currentColor"
                                />
                            </button>

                            <button className="cursor-pointer group" onClick={() => skipTime(-5)} title="快退 5 秒">
                                <Undo2
                                    className="text-gray-400 group-hover:text-indigo-600 dark:text-gray-500 dark:group-hover:text-indigo-400"
                                    size={20}
                                />
                            </button>

                            <button
                                onClick={togglePlay}
                                className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center cursor-pointer transition duration-200"
                                title={playing ? "暂停" : "播放"}
                            >
                                {playing ? <Pause size={28} fill="currentColor"/> :
                                    <Play size={28} fill="currentColor"/>}
                            </button>

                            <button className="cursor-pointer group" onClick={() => skipTime(5)} title="快进 5 秒">
                                <Redo2
                                    className="text-gray-400 group-hover:text-indigo-600 dark:text-gray-500 dark:group-hover:text-indigo-400"
                                    size={20}
                                />
                            </button>

                            <button className="cursor-pointer group" title="下一首">
                                <SkipForward
                                    className="text-gray-400 group-hover:text-indigo-600 dark:text-gray-500 dark:group-hover:text-indigo-400"
                                    size={28}
                                    fill="currentColor"
                                />
                            </button>
                        </div>
                    </div>


                    {/* 右侧功能按钮和音量、倍速 */}
                    <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300">
                        <Popover
                            trigger="hover"
                            placement="top"
                            styles={{body: {padding: 0}}}
                            getPopupContainer={(triggerNode) => triggerNode.parentElement!}
                            content={
                                <div className="p-2">
                                    <Slider
                                        vertical
                                        value={volume * 100}
                                        onChange={(val) => setVolume(val / 100)}
                                        style={{height: 100}}
                                    />
                                </div>
                            }
                        >
                            <Volume2 className="cursor-pointer" size={20}/>
                        </Popover>

                        <Select
                            value={playbackRate}
                            onChange={setPlaybackRate}
                            style={{width: 70}}
                            size="small"
                        >
                            <Option value={0.5}>0.5x</Option>
                            <Option value={1}>1x</Option>
                            <Option value={1.5}>1.5x</Option>
                            <Option value={2}>2x</Option>
                        </Select>

                        <Repeat className="cursor-pointer" size={20}/>
                        <Heart className="cursor-pointer" size={20}/>
                        <List className="cursor-pointer" size={20}/>
                    </div>
                </div>

            </div>
        </>
    )
        ;
};

export default MusicPlayer;
