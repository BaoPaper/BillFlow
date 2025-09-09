# BillFlow

BillFlow 是一个用于跟踪水电用量和计算费用的简单应用。

## 功能

- 记录电表、冷水表和热水表的读数
- 自动计算总费用
- 数据可视化显示
- 用户认证保护

## 安装和运行

1. 克隆或下载此项目
2. 安装依赖：`npm install`
3. 启动应用：`npm start`

## 环境变量配置

为了提高安全性，此应用支持通过环境变量配置敏感信息。

### 支持的环境变量

- `LOGIN_PASSWORD` - 登录密码（默认：yourpassword）
- `SESSION_SECRET` - 会话密钥（默认：your-very-secret-key-for-billflow）

### 设置环境变量

1. 复制 `.env.example` 文件为 `.env`
2. 修改 `.env` 文件中的值为实际需要的值

### Docker 环境变量

如果使用 Docker 运行，可以在 Dockerfile 中修改环境变量，或在运行容器时通过 `-e` 参数传递：

```bash
docker run -e LOGIN_PASSWORD=mypassword -e SESSION_SECRET=mysecretkey -p 3000:3000 billflow
```

## 使用

1. 访问 `http://localhost:3000`
2. 使用设置的密码登录
3. 录入新的读数或查看统计数据

## 注意事项

- 在生产环境中，请务必修改默认密码和会话密钥
- 建议使用强密码和复杂的会话密钥以提高安全性