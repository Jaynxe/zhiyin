import {Play} from "lucide-react";

interface PlaylistItemProps {
    title: string;
    artist: string;
    cover: string;
}

function PlaylistItem({title, artist, cover}: PlaylistItemProps) {
    return (
        <div className="w-40 cursor-pointer group">
            <div className="relative w-full h-40 rounded-2xl overflow-hidden">
                {/* 封面图 */}
                <img
                    src={cover}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* 轻微模糊遮罩 */}
                <div
                    className="absolute inset-0 bg-black/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"/>

                {/* 播放按钮（居中圆角带背景） */}
                <div
                    className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/80 rounded-full p-2.5  hover:scale-110 transition-transform">
                        <Play size={24} strokeWidth={0} fill="black"/>
                    </div>
                </div>
            </div>

            {/* 歌单标题和作者 */}
            <div className="mt-2">
                <h2 className="text-sm font-medium text-black dark:text-white truncate">{title}</h2>
                <p className="text-xs text-gray-500 truncate">by - {artist}</p>
            </div>
        </div>
    );
}

export default PlaylistItem;
