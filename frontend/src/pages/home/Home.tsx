import PlaylistItem from "@/components/playlist/playlistItem.tsx";
import { useEffect, useState } from "react";
import { apiClient } from "@/api/client.ts";
import {  message } from "antd";
import type { Category, Playlist } from "@/types";
import { fullImagePath } from "@/utils/common.ts";
import SongItem from "@/components/music/songItem.tsx";

function Home() {
    const [messageApi, contextHolder] = message.useMessage();
    const [catogory, setCategory] = useState<Category[]>([]);
    const [hotPlaylist, setHotPlaylist] = useState<Playlist[]>([]);
    const [likedPlaylist, setLikedPlaylist] = useState<Playlist>();

    useEffect(() => {
        const fetchHotPlaylist = async () => {
            try {
                const response = await apiClient.getHotPlaylistList({
                    page: 1,
                    pageSize: 20,
                    keyword: "",
                    sort: "play_count",
                });
                setHotPlaylist(response.data.list);
            } catch (error) {
                messageApi.error("获取歌单失败");
                console.log(error);
            }
        };
        fetchHotPlaylist();
    }, [messageApi]);

    useEffect(() => {
        const fetchCategory = async () => {
            try {
                const response = await apiClient.getCategoryList({
                    page: 1,
                    pageSize: 10,
                    keyword: "",
                });
                setCategory(response.data.list);
                messageApi.success("获取歌单成功");
            } catch (error) {
                messageApi.error("获取歌单失败");
                console.log(error);
            }
        };
        fetchCategory();
    }, [messageApi]);

    useEffect(() => {
        const fetchMyLikedPlaylist = async () => {
            try {
                const response = await apiClient.getMyLikedPlaylist();
                setLikedPlaylist(response.data);
            } catch (error) {
                messageApi.error("获取歌单失败");
                console.log(error);
            }
        };
        fetchMyLikedPlaylist();
    }, [messageApi]);

    return (
        <div>
            {contextHolder}
            <div className="flex flex-col gap-6 p-4">
                {/* 热门歌单部分 */}
                <div>
                    <h2 className="font-bold mb-2">最热歌单</h2>
                    <div
                        className="flex gap-6 overflow-x-auto"
                    >
                        {hotPlaylist.map((playlist) => (
                            <div
                                key={playlist.id}
                                className="flex-shrink-0"
                                style={{ width: 180 }}
                            >
                                <PlaylistItem
                                    title={playlist.name}
                                    artist={playlist.creator}
                                    cover={fullImagePath(playlist.cover)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-[300px]">
                        <h2 className="font-bold text-xl mb-4">歌单分类</h2>
                        <div className="flex flex-wrap gap-y-3 gap-x-2">
                            {catogory.map((category) => (
                                <button
                                    className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 mb-2 bg-white dark:bg-zinc-900 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 focus:border-indigo-600 focus:text-indigo-700 transition-all"
                                    key={category.id}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        最新歌单
                    </div>
                    <div>
                        <h2>我的喜欢</h2>
                        {likedPlaylist?.songs.map((song) => SongItem(song))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;