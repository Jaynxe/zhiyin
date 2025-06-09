import { Button, Form, Input, Modal, Tooltip, Upload, message } from "antd";
import { useState } from "react";
import RichTextEditor from "@/components/common/RichTextEditor.tsx";
import { FolderUp, Inbox } from "lucide-react";
import type { UploadFile } from "antd/es/upload/interface";
import { UPLOAD_CONFIG } from "@/config/constants.ts";
import { apiClient } from "@/api/client.ts";
import { isAxiosError } from "axios";

export default function Feedback() {
  const [openModal, setOpenModal] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [feedbackForm] = Form.useForm();

  const handleModalOk = async () => {
    try {
      const values = await feedbackForm.validateFields();
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          if (Array.isArray(value)) {
            value.forEach((item) => formData.append(key, item));
          } else {
            formData.append(key, value as string);
          }
        }
      });

      await apiClient.createFeedback(formData);
      messageApi.success("创建成功");

      handleModalCancel();
    } catch (err) {
      if (isAxiosError(err)) {
        messageApi.error(err.response?.data?.msg || "创建失败");
      } else {
        console.error(err);
      }
    }
  };
  const handleModalCancel = () => {
    setOpenModal(false);
    setOpenModal(false);
    feedbackForm.resetFields();
    setFileList([]);
  };

  // 上传控制
  const handleUploadChange = ({
    file,
    fileList,
  }: {
    file: UploadFile;
    fileList: UploadFile[];
  }) => {
    setFileList(fileList.slice(-1));

    if (file.status === "done") {
      try {
        const path = file.response?.data?.path;
        if (typeof path === "string") {
          feedbackForm.setFieldsValue({ feedback_screenshot: path });
          messageApi.success("上传成功");
        } else {
          messageApi.error("上传失败：无效的文件路径");
        }
      } catch (error) {
        messageApi.error("上传失败：处理响应数据时出错");
        console.error(error);
      }
    } else if (file.status === "error") {
      messageApi.error("上传失败");
    }
  };
  //上传前验证
  const beforeUpload = (file: File) => {
    const isImage = UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES.some(
      (type: string) => file.type === type
    );
    if (!isImage) {
      messageApi.error(UPLOAD_CONFIG.IMAGE_TYPE_ERROR_MSG);
      return Upload.LIST_IGNORE;
    }
    const isLt2M = file.size / 1024 / 1024 < UPLOAD_CONFIG.IMAGE_MAX_FILE_SIZE;
    if (!isLt2M) {
      messageApi.error(UPLOAD_CONFIG.IMAGE_SIZE_ERROR_MSG);
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  return (
    <>
      {contextHolder}
      <Tooltip title="提交反馈">
        <Button
          icon={<Inbox strokeWidth={1.5} size={20} />}
          onClick={() => setOpenModal(true)}
        />
      </Tooltip>
      <Modal
        title="提交反馈"
        open={openModal}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="提交"
        cancelText="取消"
      >
        <Form form={feedbackForm} style={{ maxWidth: 600 }} layout="vertical">
          <Form.Item
            label="主题"
            name="title"
            rules={[{ required: true, message: "请输入反馈主题!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="内容"
            name="content"
            rules={[{ required: true, message: "请输入反馈内容!" }]}
          >
            <RichTextEditor uploadType={"feedback"} />
          </Form.Item>
          <Form.Item label="截图" name="feedback_screenshot">
            <Upload
              name="file"
              listType="picture"
              maxCount={1}
              fileList={fileList}
              action={`${import.meta.env.VITE_API_BASE}/upload/?type=feedback`}
              onChange={handleUploadChange}
              beforeUpload={beforeUpload}
            >
              <Button icon={<FolderUp size={20} />}>点击上传</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
