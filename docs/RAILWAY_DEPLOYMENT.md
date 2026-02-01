# Railway 部署指南

本指南将帮助您将 GoChinaMed 项目部署到 Railway 云平台，以便手机可以通过公网访问。

## 为什么选择 Railway？

- ✅ **一键部署**：自动检测 Next.js 配置
- ✅ **免费额度**：每月 $5 免费额度
- ✅ **HTTPS 支持**：自动配置 SSL 证书
- ✅ **公网域名**：自动生成可访问的域名
- ✅ **手机友好**：部署后手机可直接访问

## 部署步骤

### 方法 1：通过 Railway 控制台部署

1. **登录 Railway**
   - 访问 [railway.app](https://railway.app)
   - 使用 GitHub 账号登录

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo" 或 "Empty Project"

3. **配置项目**
   - 如果从 GitHub 部署：选择你的仓库
   - 如果手动部署：
     - 将项目代码上传到 GitHub
     - 在 Railway 中连接该仓库

4. **自动部署**
   - Railway 会自动检测 `railway.json` 配置
   - 自动安装依赖（使用 `pnpm install`）
   - 自动构建（`pnpm run build`）
   - 自动启动（`pnpm run start`）

5. **获取访问地址**
   - 部署完成后，点击项目顶部的域名
   - 地址格式：`https://your-project.railway.app`
   - 下载页面访问：`https://your-project.railway.app/app-download`

### 方法 2：通过 Railway CLI 部署

```bash
# 1. 安装 Railway CLI（如果未安装）
npm install -g @railway/cli

# 2. 登录
railway login

# 3. 初始化项目
railway init

# 4. 部署
railway up

# 5. 查看项目状态
railway status
```

## 环境变量配置

如果项目需要环境变量，在 Railway 中配置：

1. 打开项目设置
2. 进入 "Variables" 标签
3. 添加以下环境变量（如果需要）：
   - `DATABASE_URL`：数据库连接字符串
   - `NEXT_PUBLIC_API_URL`：API 地址
   - 其他自定义环境变量

## 自定义域名（可选）

如果您有自己的域名：

1. 在 Railway 项目设置中，进入 "Domains"
2. 点击 "Add Domain"
3. 输入您的域名
4. 按照提示配置 DNS 记录

## 部署后的测试

1. **电脑测试**
   ```
   https://your-project.railway.app/app-download
   ```

2. **手机测试**
   - 在手机浏览器中直接访问上述 URL
   - 或扫描二维码（如果已配置）

## 监控和日志

- **查看日志**：在 Railway 控制台的 "Logs" 标签
- **查看指标**：在 "Metrics" 标签查看 CPU、内存使用情况
- **查看部署历史**：在 "Deploys" 标签

## 常见问题

### Q: 部署失败怎么办？
A: 查看部署日志，常见原因：
- 依赖安装失败：检查 `package.json` 和 `pnpm-lock.yaml`
- 构建错误：检查 TypeScript 编译错误
- 端口配置：确保应用监听端口正确（Railway 提供 `PORT` 环境变量）

### Q: 如何更新代码？
A: 推送新代码到 GitHub，Railway 会自动重新部署

### Q: 免费额度是多少？
A:
- $5/月 免费额度
- 包含 512 MB RAM
- 500 小时执行时间
- 1 GB 存储空间

### Q: 如何绑定自定义域名？
A: 见上方"自定义域名"章节

## 项目配置说明

项目已包含 `railway.json` 配置文件：

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "pnpm run start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

## 相关链接

- [Railway 官方文档](https://docs.railway.app)
- [Next.js 部署指南](https://docs.railway.app/deploy/nextjs)
- [Railway 定价](https://railway.app/pricing)

## 技术支持

如果遇到问题：
1. 查看 Railway 日志
2. 检查项目配置
3. 参考 Railway 官方文档
4. 提交 Issue 到项目仓库
