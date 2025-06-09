import type {Song} from "@/types";
import { Play, Heart } from "lucide-react";

function SongItem(song: Song) {
    return (
        <div className="flex items-center px-2 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800 transition group select-none">
            {/* 歌名 */}
            <div className="flex-1 font-medium text-base text-black dark:text-white truncate">
                {song.title}
            </div>
            {/* 歌手 */}
            <div className="w-48 text-center text-gray-500 dark:text-gray-400 truncate">
                {song.singer}
            </div>
            {/* 专辑 */}
            <div className="w-64 text-center text-gray-500 dark:text-gray-400 truncate">
                {song.album}
            </div>
            {/* 时长 */}
            <div className="w-16 text-center text-gray-500 dark:text-gray-400">
                --:--
            </div>
            {/* 收藏按钮 */}
            <button
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition mr-2"
                title="收藏"
            >
                <Heart className="text-gray-400 group-hover:text-indigo-500" size={20} />
            </button>
            {/* 播放按钮 */}
            <button
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition"
                title="播放"
            >
                <Play className="text-gray-500 group-hover:text-indigo-600 dark:text-gray-400 dark:group-hover:text-indigo-400" size={20} />
            </button>
        </div>
    );
}

export default SongItem;