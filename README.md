# 抖音热搜日报 Douyin Hot Daily

每日自动推送抖音热搜榜到飞书。支持 **GitHub Actions** 和 **Cloudflare Workers** 两种部署方式。

## 功能

- 每日定时抓取抖音热搜 Top30
- 推送到飞书机器人消息
- 两种部署方式可选
- 自动重试，失败告警

## 目录结构

```
douyin-hot/
├── douyin_hot.py           # Python 版主脚本（GitHub Actions 用）
├── worker/
│   ├── src/index.js        # Cloudflare Worker 脚本
│   ├── wrangler.toml       # Worker 配置
│   └── package.json
├── .github/workflows/
│   ├── daily.yml           # 定时任务（每天 12:00 UTC）
│   └── deploy.yml          # Worker 自动部署
└── README.md
```

## 配置

需要以下飞书应用凭证（在 [飞书开发者后台](https://open.feishu.cn/app) 创建应用）：

| 变量 | 说明 |
|------|------|
| `FEISHU_APP_ID` | 飞书应用 App ID |
| `FEISHU_APP_SECRET` | 飞书应用 App Secret |
| `FEISHU_ADMIN_OPEN_ID` | 接收消息的用户 Open ID |

## 部署方式

### 方式一：GitHub Actions（推荐）

1. Fork / Clone 此仓库
2. 在 GitHub Settings → Secrets and variables → Actions 添加三个 Secrets
3. 启用 GitHub Actions，每天 UTC 12:00（北京时间 20:00）自动推送

### 方式二：Cloudflare Workers

1. 在 GitHub Secrets 中添加 `CF_API_TOKEN`
2. 推送 main 分支自动部署

或在本地部署：

```bash
cd worker
npm install
npx wrangler deploy src/index.js
npx wrangler secret put FEISHU_APP_ID
npx wrangler secret put FEISHU_APP_SECRET
npx wrangler secret put FEISHU_ADMIN_OPEN_ID
```

## 运行效果

每日收到飞书消息：

```
今日抖音热搜  05/18

1. 热点话题标题  1000万+
2. 另一个热搜    800万+
...
```

## 许可

MIT
