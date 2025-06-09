// RichTextEditor.tsx
import React, {useEffect, useState} from "react";
import {Editor, Toolbar} from "@wangeditor/editor-for-react";
import type {
    IDomEditor,
    IEditorConfig,
    IToolbarConfig,
} from "@wangeditor/editor";
import {UPLOAD_CONFIG} from "@/config/constants.ts";
import {message} from "antd";
import {fullImagePath} from "@/utils/common.ts";

interface Props {
    value?: string;
    onChange?: (value: string) => void;
    uploadType?:
        | "advertise"
        | "avatar"
        | "cover"
        | "feedback"
        | "source"
        | "video";
}

interface UploadResponse {
    code: number;
    data?: {
        path: string;
    };
    msg?: string;
}

const editorConfig: Partial<IEditorConfig> = {
    placeholder: "请输入内容...",
    MENU_CONF: {
        uploadImage: {
            // 接口地址
            server: `${import.meta.env.VITE_API_BASE}/upload/`,

            // 上传字段名
            fieldName: "file",

            // 上传前检查
            checkImage(file: File) {
                // 检查文件类型
                if (
                    !UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES.includes(
                        file.type as (typeof UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES)[number]
                    )
                ) {
                    message.error(UPLOAD_CONFIG.IMAGE_TYPE_ERROR_MSG);
                    return false;
                }
                // 检查文件大小
                const isLt2M =
                    file.size / 1024 / 1024 < UPLOAD_CONFIG.IMAGE_MAX_FILE_SIZE;
                if (!isLt2M) {
                    message.error(UPLOAD_CONFIG.IMAGE_SIZE_ERROR_MSG);
                    return false;
                }
                return true;
            },

            // 自定义插入图片
            customInsert(
                res: UploadResponse,
                insertFn: (url: string, alt: string, href: string) => void
            ) {
                if (res?.code === 0 && res?.data?.path) {
                    // 拼接完整 URL
                    const imageUrl = fullImagePath(res.data.path);
                    insertFn(imageUrl, "", "");
                } else {
                    message.error("图片上传失败");
                    console.error("上传失败：", res);
                }
            },
        },

        uploadVideo: {
            // 接口地址
            server: `${import.meta.env.VITE_API_BASE}/upload/`,

            // 上传字段名
            fieldName: "file",
            // 修改默认的限制大小
            maxFileSize: UPLOAD_CONFIG.VIDEO_MAX_FILE_SIZE * 1024 * 1024,
            // 上传前检查
            checkVideo(file: File) {
                // 检查文件类型
                if (
                    !UPLOAD_CONFIG.ALLOWED_VIDEO_TYPES.includes(
                        file.type as (typeof UPLOAD_CONFIG.ALLOWED_VIDEO_TYPES)[number]
                    )
                ) {
                    message.error(UPLOAD_CONFIG.VIDEO_TYPE_ERROR_MSG);
                    return false;
                }
                // 检查文件大小
                const isLt100M =
                    file.size / 1024 / 1024 < UPLOAD_CONFIG.VIDEO_MAX_FILE_SIZE;
                if (!isLt100M) {
                    message.error(UPLOAD_CONFIG.VIDEO_SIZE_ERROR_MSG);
                    return false;
                }
                return true;
            },

            // 自定义插入视频
            customInsert(
                res: UploadResponse,
                insertFn: (url: string, poster: string) => void
            ) {
                if (res?.code === 0 && res?.data?.path) {
                    // 拼接完整 URL
                    const videoUrl = fullImagePath(res.data.path);
                    insertFn(videoUrl, "");
                } else {
                    message.error("视频上传失败");
                    console.error("上传失败：", res);
                }
            },
        },
    },
};

const RichTextEditor: React.FC<Props> = ({
                                             value = "",
                                             onChange,
                                             uploadType = "cover",
                                         }) => {
    const [editor, setEditor] = useState<IDomEditor | null>(null);
    const [html, setHtml] = useState(value);

    // 创建编辑器配置
    const createEditorConfig = () => {
        const config = {...editorConfig};
        if (config.MENU_CONF?.uploadImage) {
            config.MENU_CONF.uploadImage.server = `${
                import.meta.env.VITE_API_BASE
            }/upload/?type=${uploadType}`;
        }
        if (config.MENU_CONF?.uploadVideo) {
            config.MENU_CONF.uploadVideo.server = `${
                import.meta.env.VITE_API_BASE
            }/upload/?type=video`;
        }
        return config;
    };

    useEffect(() => {
        return () => {
            editor?.destroy();
        };
    }, [editor]);

    useEffect(() => {
        // 外部更新时同步本地状态
        if (value !== html) {
            setHtml(value || "");
        }
    }, [value, html]);

    const toolbarConfig: Partial<IToolbarConfig> = {};

    return (
        <div style={{border: "1px solid #ccc", padding: 10}}>
            <Toolbar editor={editor} defaultConfig={toolbarConfig} mode="default"/>
            <Editor
                value={html}
                defaultConfig={createEditorConfig()}
                onCreated={setEditor}
                onChange={(editor) => {
                    const html = editor.getHtml();
                    setHtml(html);
                    onChange?.(html);
                }}
                mode="default"
                style={{height: 300, overflowY: "auto"}}
            />
        </div>
    );
};

export default RichTextEditor;
