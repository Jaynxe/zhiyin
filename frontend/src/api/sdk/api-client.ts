import type {AxiosInstance, AxiosRequestConfig} from "axios";
import axios from "axios";
import type {
    Advertise,
    Auth,
    Category,
    Feedback,
    Language,
    List,
    Comment,
    LoginLog, Notice,
    QueryParams,
    Response, Song,
    SystemInfo, User, DashboardData, Playlist,
} from "@/types";
import {message} from "antd";
import React from "react";

export class ApiClient {
    instance: AxiosInstance;

    constructor(config: AxiosRequestConfig) {
        this.instance = axios.create(config);

        this.instance.interceptors.request.use(
            (config) => {
                // 请求成功
                const token = localStorage.getItem("accessToken");
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                // 请求失败
                return Promise.reject(error);
            }
        );
        this.instance.interceptors.response.use(
            (response) => {
                // 请求成功，直接返回响应
                return response;
            },
            (error) => {
                // 请求失败
                if (error.response?.status === 401) {
                    // 保存当前页面URL
                    const currentPath = window.location.pathname;
                    if (currentPath !== "/login" && currentPath !== "/register") {
                        localStorage.setItem("redirectPath", currentPath);
                    }

                    // 清除所有认证相关的本地存储
                    ["accessToken", "username", "userRole", "avatar"].forEach((key) =>
                        localStorage.removeItem(key)
                    );

                    // 显示错误消息
                    message.error("登录已过期，请重新登录");

                    // 延迟重定向，让用户看到错误消息
                    setTimeout(() => {
                        window.location.href = "/login";
                    }, 1500);
                }
                return Promise.reject(error);
            }
        );
    }

    // auth
    async login(credentials: {
        username: string;
        password: string;
    }): Promise<Response<Auth>> {
        const response = await this.instance.post<Response<Auth>>(
            "user/login/",
            credentials
        );
        return response.data;
    }

    async logout(): Promise<Response<Auth>> {
        const response = await this.instance.post<Response<Auth>>("user/logout/");
        return response.data;
    }

    async register(credentials: {
        username: string;
        password: string;
        repassword: string;
    }): Promise<Response<Auth>> {
        const response = await this.instance.post<Response<Auth>>(
            "user/register/",
            credentials
        );
        return response.data;
    }

    /* ================ admin ================ */
    async systemInfo(): Promise<Response<SystemInfo>> {
        const response = await this.instance.get<Response<SystemInfo>>(
            "admin/overview/sysInfo/"
        );
        return response.data;
    }

    async dashboardInfo(): Promise<Response<DashboardData>> {
        const response = await this.instance.get<Response<DashboardData>>(
            "admin/overview/getDashboardInfo/"
        )
        return response.data;
    }

    // 用户
    async getUserList(params?: QueryParams): Promise<Response<List<User>>> {
        const response = await this.instance.get<Response<List<User>>>(
            "admin/user/getUserList/",
            {
                params: params,
            }
        );
        return response.data;
    }

    async createUser(data: FormData): Promise<Response<User>> {
        const response = await this.instance.post<Response<User>>(
            "admin/user/create/",
            data
        );
        return response.data;
    }

    async updateUser(id: string, data: FormData): Promise<Response<User>> {
        const response = await this.instance.put<Response<User>>(
            `admin/user/${id}/update/`,
            data
        )
        return response.data;
    }

    async updateUserPassword(id: string, data: FormData): Promise<Response<null>> {
        const response = await this.instance.put<Response<null>>(
            `admin/user/${id}/updatePassword/`,
            data
        )
        return response.data;
    }

    async deleteUser(ids: React.Key[]): Promise<Response<null>> {
        const response = await this.instance.delete<Response<null>>(
            `admin/user/delete/`,
            {data: ids}
        );
        return response.data;
    }

    // 歌曲
    async getSongList(params?: QueryParams): Promise<Response<List<Song>>> {
        const response = await this.instance.get<Response<List<Song>>>(
            "admin/song/getSongList/",
            {
                params: params,
            }
        );
        return response.data;
    }

    async createSong(data: FormData): Promise<Response<Song>> {
        const response = await this.instance.post<Response<Song>>(
            "admin/song/create/",
            data
        );
        return response.data;
    }

    async updateSong(id: string, data: FormData): Promise<Response<Song>> {
        const response = await this.instance.put<Response<Song>>(
            `admin/song/${id}/update/`,
            data
        )
        return response.data;
    }

    async deleteSong(ids: React.Key[]): Promise<Response<null>> {
        const response = await this.instance.delete<Response<null>>(
            `admin/song/delete/`,
            {data: ids}
        );
        return response.data;
    }

    // 歌单
    async getAdminPlaylistList(
        params?: QueryParams
    ): Promise<Response<List<Playlist>>> {
        const response = await this.instance.get<Response<List<Playlist>>>(
            "admin/playlist/getPlaylistList/",
            {
                params: params,
            }
        );
        return response.data;
    }

    async createPlaylist(data: FormData): Promise<Response<Playlist>> {
        const response = await this.instance.post<Response<Playlist>>(
            "admin/playlist/create/",
            data
        );
        return response.data;
    }

    async updatePlaylist(
        id: string,
        data: FormData
    ): Promise<Response<Playlist>> {
        const response = await this.instance.put<Response<Playlist>>(
            `admin/playlist/${id}/update/`,
            data
        )
        return response.data;
    }

    async deletePlaylist(ids: React.Key[]): Promise<Response<null>> {
        const response = await this.instance.delete<Response<null>>(
            `admin/playlist/delete/`,
            {data: ids}
        )
        return response.data;
    }

    // 广告
    async getAdvertise(params?: QueryParams): Promise<Response<List<Advertise>>> {
        const response = await this.instance.get<Response<List<Advertise>>>(
            "admin/advertise/getAdvertiseList/",
            {
                params: params,
            }
        );

        return response.data;
    }

    async createAdvertise(data: FormData): Promise<Response<Advertise>> {
        const response = await this.instance.post<Response<Advertise>>(
            "admin/advertise/create/",
            data
        );

        return response.data;
    }

    async updateAdvertise(
        id: string,
        data: FormData
    ): Promise<Response<Advertise>> {
        const response = await this.instance.put<Response<Advertise>>(
            `admin/advertise/${id}/update/`,
            data
        );
        return response.data;
    }

    async deleteAdvertise(ids: React.Key[]): Promise<Response<null>> {
        const response = await this.instance.delete<Response<null>>(
            `admin/advertise/delete/`,
            {data: ids}
        );
        return response.data;
    }

    // 登录日志
    async getLoginLogList(
        params?: QueryParams
    ): Promise<Response<List<LoginLog>>> {
        const response = await this.instance.get<Response<List<LoginLog>>>(
            "admin/loginLog/getLoginLogList/",
            {
                params: params,
            }
        );

        return response.data;
    }

    async deleteLoginLog(ids: React.Key[]): Promise<Response<null>> {
        const response = await this.instance.delete<Response<null>>(
            `admin/loginLog/delete/`,
            {data: ids}
        );
        return response.data;
    }

    // 语言
    async getLanguageList(
        params?: QueryParams
    ): Promise<Response<List<Language>>> {
        const response = await this.instance.get<Response<List<Language>>>(
            "admin/language/getLanguageList/",
            {
                params: params,
            }
        );

        return response.data;
    }

    async createLanguage(data: FormData): Promise<Response<Language>> {
        const response = await this.instance.post<Response<Language>>(
            "admin/language/create/",
            data
        );

        return response.data;
    }

    async updateLanguage(
        id: string,
        data: FormData
    ): Promise<Response<Language>> {
        const response = await this.instance.put<Response<Language>>(
            `admin/language/${id}/update/`,
            data
        );
        return response.data;
    }

    async deleteLanguage(ids: React.Key[]): Promise<Response<null>> {
        const response = await this.instance.delete<Response<null>>(
            `admin/language/delete/`,
            {data: ids}
        );
        return response.data;
    }

    // 分类
    async getCategoryList(
        params?: QueryParams
    ): Promise<Response<List<Category>>> {
        const response = await this.instance.get<Response<List<Category>>>(
            "admin/category/getCategoryList/",
            {
                params: params,
            }
        );

        return response.data;
    }

    async createCategory(data: FormData): Promise<Response<Category>> {
        const response = await this.instance.post<Response<Category>>(
            "admin/category/create/",
            data
        );

        return response.data;
    }

    async updateCategory(
        id: string,
        data: FormData
    ): Promise<Response<Category>> {
        const response = await this.instance.put<Response<Category>>(
            `admin/category/${id}/update/`,
            data
        );
        return response.data;
    }

    async deleteCategory(ids: React.Key[]): Promise<Response<null>> {
        const response = await this.instance.delete<Response<null>>(
            `admin/category/delete/`,
            {data: ids}
        );
        return response.data;
    }

    // 反馈
    async getFeedbackList(
        params?: QueryParams
    ): Promise<Response<List<Feedback>>> {
        const response = await this.instance.get<Response<List<Feedback>>>(
            "admin/feedback/getFeedbackList/",
            {
                params: params,
            }
        );

        return response.data;
    }

    async updateFeedback(
        id: string,
        data: FormData
    ): Promise<Response<Feedback>> {
        const response = await this.instance.put<Response<Feedback>>(
            `admin/feedback/${id}/update/`,
            data
        );
        return response.data;
    }

    async deleteFeedback(ids: React.Key[]): Promise<Response<null>> {
        const response = await this.instance.delete<Response<null>>(
            `admin/feedback/delete/`,
            {data: ids}
        );
        return response.data;
    }

//   通知
    async getNoticeList(
        params?: QueryParams
    ): Promise<Response<List<Notice>>> {
        const response = await this.instance.get<Response<List<Notice>>>(
            "admin/notice/get/",
            {
                params: params,
            }
        );

        return response.data;
    }

    async createAnnouncement(data: FormData): Promise<Response<Notice>> {
        const response = await this.instance.post<Response<Notice>>(
            "admin/notice/createForAll/",
            data
        );
        return response.data;
    }

    async createNotice(data: FormData): Promise<Response<Notice>> {
        const response = await this.instance.post<Response<Notice>>(
            "admin/notice/createForSome/",
            data
        );
        return response.data;
    }

    async updateNotice(
        id: string,
        data: FormData
    ): Promise<Response<Notice>> {
        const response = await this.instance.put<Response<Notice>>(
            `admin/notice/${id}/update/`,
            data
        );
        return response.data;
    }

    async deleteNotice(ids: React.Key[]): Promise<Response<null>> {
        const response = await this.instance.delete<Response<null>>(
            `admin/notice/delete/`,
            {data: ids}
        );
        return response.data;
    }

    // 评论
    async getCommentList(
        params?: QueryParams
    ): Promise<Response<List<Comment>>> {
        const response = await this.instance.get<Response<List<Comment>>>(
            "admin/comment/getCommentList/",
            {
                params: params,
            }
        );
        return response.data;
    }

    async updateComment(
        id: string,
        data: FormData
    ): Promise<Response<Comment>> {
        const response = await this.instance.put<Response<Comment>>(
            `admin/comment/${id}/update/`,
            data
        );
        return response.data;
    }

    async deleteComment(ids: React.Key[]): Promise<Response<null>> {
        const response = await this.instance.delete<Response<null>>(
            `comment/delete/`,
            {data: ids}
        );
        return response.data;
    }

    /* ================ 前台 ================ */

    // 反馈
    async createFeedback(data: FormData): Promise<Response<Feedback>> {
        const response = await this.instance.post<Response<Feedback>>(
            "feedback/create/",
            data
        );
        return response.data;
    }

    async getFeedbackListForUser(
        params?: QueryParams
    ): Promise<Response<List<Feedback>>> {
        const response = await this.instance.get<Response<List<Feedback>>>(
            "feedback/getFeedbackList/",
            {
                params: params,
            }
        );
        return response.data;
    }

    async updateFeedbackForUser(
        id: string,
        data: FormData
    ): Promise<Response<Feedback>> {
        const response = await this.instance.put<Response<Feedback>>(
            `feedback/${id}/update/`,
            data
        );
        return response.data;
    }

    async deleteFeedbackForUser(ids: React.Key[]): Promise<Response<null>> {
        const response = await this.instance.delete<Response<null>>(
            `feedback/delete/`,
            {data: ids}
        );
        return response.data;
    }

    // 歌单
    async getHotPlaylistList(params?: QueryParams): Promise<Response<List<Playlist>>> {
        const response = await this.instance.get<Response<List<Playlist>>>(
            "playlist/getPlaylistList/",
            {
                params: params,
            }
        );
        return response.data;
    }

    async getMyLikedPlaylist(): Promise<Response<Playlist>> {
        const response = await this.instance.get<Response<Playlist>>(
            "playlist/getLikedPlaylist/"
        );
        return response.data;
    }
}
