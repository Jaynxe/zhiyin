# 知音项目

这是一个使用现代技术栈构建的全栈应用项目。

## 项目结构

```
.
├── frontend/          # React + TypeScript 前端项目
└── backend/           # Python 后端项目
```

## 技术栈

### 前端
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- 状态管理（待定）

### 后端
- Python
- FastAPI
- SQLAlchemy
- PostgreSQL

## 开发环境设置

### 前端
```bash
cd frontend
pnpm install
pnpm dev
```

### 后端
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

## 项目规范

- 使用 ESLint 和 Prettier 进行代码格式化
- 遵循 TypeScript 严格模式
- 使用 Conventional Commits 规范进行提交
- 使用 Git Flow 工作流

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

[MIT](LICENSE) 