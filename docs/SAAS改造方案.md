# AI-Tarot-Tell SaaS 改造与部署说明

## 架构概览
- 前端：`frontend/`（React + Vite + Nginx 镜像），生产端口 **3701**，默认语言优先越南语，可手动切换中文。
- 后端：`backend/`（Node.js + Express + SQLite + @google/genai），端口 **3702**，提供登录、用量、塔罗解读接口。
- 数据：`backend/data/ai-tarot.db`（better-sqlite3，启动自动建表并写入种子账户）。
- 部署：`docker-compose.yml` 一键启动；`systemd` 单元可做开机自启；公网访问 `http://162.0.231.96:3701`（前端）对接 `http://162.0.231.96:3702`。

## 目录结构
```
AI-Tarot-Tell/
├── frontend/                  # 前端源代码
│   ├── Dockerfile             # Nginx 静态站点
│   ├── nginx.conf             # SPA 路由回退
│   ├── .env                   # VITE_API_BASE_URL=http://162.0.231.96:3702
├── backend/                   # 后端服务
│   ├── Dockerfile             # Node 运行
│   ├── .env                   # GEMINI_API_KEY=...，PORT=3702，DB_PATH=./data/ai-tarot.db
│   ├── src/server.ts          # Express 入口
│   ├── src/db.ts              # SQLite 表与种子账户
│   └── data/ai-tarot.db       # 运行时持久化（挂载卷）
├── systemd/                   # systemd 单元
│   ├── ai-tarot-frontend.service
│   └── ai-tarot-backend.service
├── docker-compose.yml
└── docs/
    └── SAAS改造方案.md
```

## 后端接口
- `POST /api/auth/login` `{ username, password }` → `{ user, usage, token }`
- `GET /api/usage` 头 `x-api-token` → `{ limit, used, remaining, plan }`
- `POST /api/tarot/reading` 头 `x-api-token`，体 `{ cardName, positionLabel, spreadName, isReversed, language }` → `{ text, usage }`
- `POST /api/tarot/full-reading` 体 `{ spreadName, cards[], language }` → `{ text, usage }`
- `GET /api/health` 健康检查

## 种子账户与配额
- `test / test123`：plan=test，limit=50，valid 30 天
- `pro / pro123`：plan=monthly，limit=200，valid 90 天
- 登录返回 token，调用 API 需携带 `x-api-token`。

## Docker 部署（推荐）
```bash
cd /root/LUMOS\ AI/AI-Tarot-Tell
docker compose build
docker compose up -d

# 访问
# 前端: http://162.0.231.96:3701
# 后端: http://162.0.231.96:3702/api/health
```

### 挂载与环境
- backend 数据卷：`./backend/data:/app/data`
- backend 环境：`backend/.env`（已写入提供的 GEMINI_API_KEY、3702 端口、CORS 白名单）
- frontend 构建参数：`VITE_API_BASE_URL=http://backend:3702`（compose 已注入，外部访问仍走 162.0.231.96:3702）

## 手工运行（无 Docker）
```bash
# 后端
cd /root/LUMOS\ AI/AI-Tarot-Tell/backend
npm install
npm run build
NODE_ENV=production npm run start

# 前端
cd /root/LUMOS\ AI/AI-Tarot-Tell/frontend
npm install
npm run build
npm run preview -- --host 0.0.0.0 --port 3701
```

## systemd 开机自启
```bash
cp /root/LUMOS\ AI/AI-Tarot-Tell/systemd/ai-tarot-backend.service /etc/systemd/system/
cp /root/LUMOS\ AI/AI-Tarot-Tell/systemd/ai-tarot-frontend.service /etc/systemd/system/

systemctl daemon-reload
systemctl enable --now ai-tarot-backend.service
systemctl enable --now ai-tarot-frontend.service
```

## 环境变量
- 后端 `.env`（已写入提供的密钥）：
  - `PORT=3702`
  - `HOST=0.0.0.0`
  - `CORS_ORIGIN=http://162.0.231.96:3701,http://localhost:3701`
  - `DB_PATH=./data/ai-tarot.db`
  - `GEMINI_API_KEY=AIzaSyCy0Q7wWVdxzoHb5TZkFFrGUsuyEUI6_CY`
- 前端 `.env`：`VITE_API_BASE_URL=http://162.0.231.96:3702`

## 产品行为
- 未登录：可浏览 3D 牌桌与牌阵，但调用解读/全盘报告时弹出登录窗；默认越南语，可切换中文。
- 登录后：右上角显示用户与剩余额度，调用 Gemini 由后端代理并计次。
- 配额耗尽：前端提示，不再请求后端。

## 关键改动回顾
- 单体拆分为 `frontend/` + `backend/`，前端不再直接持有密钥。
- 增加登录/配额控制、越南语默认、延迟登录弹窗。
- 提供 Dockerfile、docker-compose、systemd 便于生产部署。
