# GoChinaMed - Medical care in China, made easy.

GoChinaMed 是一个智能医疗旅游平台，帮助国际患者访问中国顶级医疗服务。平台集成了 AI 智能体、多语言支持、医生/医院信息展示和行程规划功能。

## 产品信息

- **产品名称**: GoChinaMed
- **Slogan**: Medical care in China, made easy.
- **出品方**: 山东和拾方信息科技有限公司
- **核心商业模式**: 平台撮合 + 服务代订 + 5% 智能体/平台服务费

## 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **样式**: Tailwind CSS 4
- **数据库**: PostgreSQL (Drizzle ORM)
- **对象存储**: S3 兼容存储
- **AI 模型**: 豆包大模型 (Doubao)
- **语音服务**: 豆包语音 (TTS/ASR)

## 核心功能

### 1. 多语言支持
- 支持 EN/DE/FR/ZH 四种语言
- 自动识别系统语言
- 一键切换语言

### 2. 首页与发现
- 名医名院展示
- 瀑布流布局
- 附近景点介绍（LBS）
- Banner 广告位

### 3. AI 智能体管家
- 语音输入支持（ASR）
- 资料上传（MRI、CT、病历）
- 智能对话与分析
- 医疗+旅游方案生成
- 流式输出（SSE）

### 4. 医疗检索
- 按病种/医生/医院筛选
- 医生/医院详情页
- 手术方案介绍
- 费用透明展示

### 5. 行程与预订
- 出行方案生成
- 医生预约、导游、酒店、机票、高铁票
- 代预订功能
- 景点门票集成

### 6. 支付与账单
- 国际支付：Stripe/PayPal/VISA
- 国内支付：微信支付/支付宝
- 费用明细弹窗（医疗费、酒店费、机票费、服务费）
- 服务费率可配置（默认5%）

### 7. 社区功能
- 患者沟通空间
- 经验分享
- 积分管理

## 数据库表结构

### 核心表
- `users` - 用户表
- `doctors` - 医生表
- `hospitals` - 医院表
- `diseases` - 病种表
- `orders` - 订单表
- `itineraries` - 行程表
- `payments` - 支付记录表
- `community_posts` - 社区帖子表
- `comments` - 评论表
- `likes` - 点赞表
- `ai_conversations` - AI 对话记录表
- `settings` - 系统设置表
- `banners` - Banner 广告表
- `attractions` - 旅游景点表
- `medical_records` - 医疗记录表

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── ai/           # AI 相关 API
│   │   ├── doctors/      # 医生 API
│   │   ├── hospitals/    # 医院 API
│   │   └── upload/       # 文件上传 API
│   ├── ai-assistant/     # AI 助手页面
│   └── page.tsx          # 首页
├── components/            # React 组件
│   ├── layout/           # 布局组件
│   └── ui/               # shadcn/ui 组件
├── contexts/             # React Context
│   └── LanguageContext   # 多语言上下文
├── storage/              # 数据存储
│   └── database/         # 数据库管理
│       ├── shared/       # 共享 Schema
│       └── *Manager.ts   # 数据访问层
├── hooks/                # 自定义 Hooks
├── lib/                  # 工具函数
└── locales/              # 国际化文件
    ├── en.json           # 英文
    └── zh.json           # 中文
```

## 快速开始

### 环境要求
- Node.js 24
- pnpm 9.0.0+

### 安装依赖
```bash
pnpm install
```

### 开发环境
```bash
pnpm dev
```
访问 http://localhost:5000

### 构建生产版本
```bash
pnpm build
```

### 启动生产环境
```bash
pnpm start
```

## 数据库操作

### 同步模型
```bash
coze-coding-ai db generate-models
```

### 更新数据库
```bash
coze-coding-ai db upgrade
```

## API 端点

### 医生相关
- `GET /api/doctors/featured` - 获取推荐医生

### 医院相关
- `GET /api/hospitals/featured` - 获取推荐医院

### AI 助手
- `POST /api/ai/chat` - AI 对话（流式输出）
- `GET /api/ai/chat` - 获取对话历史

### 文件上传
- `POST /api/upload` - 上传文件（医疗记录）

## 集成服务

项目已集成以下服务：

1. **大语言模型** - 豆包大模型（Doubao）
   - 支持多轮对话
   - 流式输出
   - 思考模式

2. **语音服务** - 豆包语音
   - 语音识别（ASR）
   - 语音合成（TTS）

3. **对象存储** - S3 兼容存储
   - 文件上传
   - 签名 URL 生成

4. **数据库** - PostgreSQL
   - Drizzle ORM
   - 类型安全

## 部署

项目使用 Coze CLI 进行部署：

```bash
coze build
coze start
```

## 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目由山东和拾方信息科技有限公司开发并保留所有权利。

## 联系方式

- 公司：山东和拾方信息科技有限公司
- GitHub: https://github.com/zzw2011341-ops/gochinamed

---

**GoChinaMed - Medical care in China, made easy.**
