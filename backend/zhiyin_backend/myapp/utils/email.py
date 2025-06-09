
from email.message import EmailMessage
from email.utils import formataddr
from email.header import Header
from django.utils.html import strip_tags
import smtplib
from django.conf import settings

def send_email(receiver: str, subject: str, content: str, html: bool = False) -> None:
    """
    发送支持 HTML 的邮件（兼容纯文本客户端）

    Args:
        receiver: 收件人邮箱
        subject: 邮件主题
        content: 邮件正文（可为 HTML）
        html: 是否以 HTML 格式发送邮件
    Raises:
        ValueError: 如果认证失败或SMTP错误
    """
    # 清理主题和内容
    cleaned_subject = subject.replace('\n', ' ').replace('\r', ' ')
    cleaned_content = content.replace('\x00', '')  # 移除非法字符

    try:
        msg = EmailMessage()
        msg["From"] = formataddr(("知音", settings.EMAIL_USER))
        msg["To"] = receiver
        msg["Subject"] = str(Header(cleaned_subject, "utf-8"))

        if html:
            # 设置纯文本和 HTML 两种内容
            plain_text = strip_tags(cleaned_content)
            msg.set_content(plain_text, charset="utf-8")  # fallback 纯文本
            msg.add_alternative(cleaned_content, subtype="html", charset="utf-8")
        else:
            msg.set_content(cleaned_content, charset="utf-8")

        with smtplib.SMTP_SSL(settings.EMAIL_HOST, settings.EMAIL_PORT, timeout=10) as smtp:
            smtp.login(settings.EMAIL_USER, settings.EMAIL_AUTH)
            smtp.send_message(msg)

        print("邮件发送成功！")

    except smtplib.SMTPAuthenticationError as e:
        raise ValueError(f"邮箱登录失败，请检查用户名/授权码: {e}")
    except (smtplib.SMTPException, ConnectionError) as e:
        raise ValueError(f"SMTP服务器错误: {e}")
