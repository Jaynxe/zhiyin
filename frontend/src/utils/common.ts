// 拼接完整路径
export const fullImagePath = (path: string): string =>
  `${import.meta.env.VITE_API_BASE}/upload/${path}`;

// 判断富文本内容是否为空（如 <p><br></p>）
export function isEmptyContent(html: string): boolean {
  return !html || html.trim() === "" || html.trim() === "<p><br></p>";
}