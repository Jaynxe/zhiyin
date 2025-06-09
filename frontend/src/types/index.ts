export interface Response<T> {
    code: number;
    msg: string;
    data: T;
}

export interface List<T> {
    list: T[];
    page: number;
    pageSize: number;
    total: number;
}

export interface QueryParams {
    page: number;
    pageSize: number;
    keyword: string;
    [key : string]: number | string;
}

export interface PaginationState {
    current: number;
    pageSize: number;
    total: number;
}

//login
export interface Auth {
    accessToken: string;
    userInfo: {
        username: string;
        avatar: string;
        role: "0" | "1";
        email: string;
    };
}

export interface User {
    readonly id: string;
    username: string;
    nickname: string;
    avatar: string;
    email: string;
    description: string;
    mobile: string;
    gender: string;
    role: string;
    status: string;
    readonly create_time: string;
    readonly update_time: string;
}

export interface Song {
    album: null | string;
    classification_name: string;
    cover: string;
    create_time: string;
    description: null;
    id: string;
    issuer: null | string;
    username: string
    language_name: string;
    plays: number;
    singer: string;
    source: string;
    lyric: string;
    status: string;
    title: string;
}

export interface Playlist {
    readonly id: string;
    name: string;
    cover: string;
    create_time: string;
    update_time: string;
    description: string;
    song_count: number;
    classifications: string[];
    status: string;
    creator: string;
    songs: Song[];
    visibility: string;
    collect_users: string[];
    collect_count: number;
    play_count: number;
}

export interface SystemInfo {
    cpuCount: number;
    cpuLoad: number;
    locale: string;
    memoryPercent: number;
    memoryTotalGB: number;
    memoryUsedGB: number;
    osBuild: string;
    osName: string;
    platform: string;
    processor: string;
    pyVersion: string;
    sysName: string;
    timezone: string;
    versionName: string;
}

interface DailyCount {
    date: string;  // 格式：YYYY-MM-DD
    count: number; // 当天数量
}

export interface DashboardData {
    song_count: number;                 // 音乐总数
    user_count: number;                 // 用户总数
    total_plays: number;                // 总播放次数
    comment_count: number;              // 总评论数
    order_rank_data: {                  // 热门歌曲排名数组
        title: string;
        count: number;
    }[];
    classification_rank_data: {        // 分类统计数组
        name: string;
        count: number;
    }[];
    user_growth: DailyCount[];         // 日新增用户数，最近7天
    song_growth: DailyCount[];         // 日新增歌曲数，最近7天
}

export interface Advertise {
    readonly id: string;
    title: string;
    cover: string;
    link: string;
    status: string;
    readonly create_time: string;
    readonly update_time: string;
}

export interface LoginLog {
    readonly id: string;
    username: string;
    readonly ip: string;
    readonly ua: string;
    readonly log_time: string;
}

export interface Language {
    readonly id: string;
    name: string;
    readonly create_time: string;
    readonly update_time: string;
}

export interface Category {
    readonly id: string;
    name: string;
    readonly create_time: string;
    readonly update_time: string;
}

export interface Feedback {
    id: string;
    content: string;
    create_time: string;
    email: string;
    feedback_screenshot: null | string;

    reply: null | string;
    status: string;
    title: string;
    update_time: string;
    user: string;
}

export interface Notice {
    id: string;
    content: string;
    create_time: string;
    status: string;
    title: string;
    is_global: boolean;
    type: string;
}

export interface Comment {
    content: string;
    id: string;
    level: number;
    like_count: number;
    parent: string;
    song: string;
    song_name: string;
    status: string;
    user: string;
    username: string;
    comment_time: string;
    update_time: string;
}
