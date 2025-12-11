# tarot.lumosai.asia 部署与证书指引

适用对象：将本项目 (`frontend:3701`, `backend:3702`) 通过宿主机 Nginx 反向代理到域名 `tarot.lumosai.asia`，并使用 Let’s Encrypt 证书。

## 1. 前置条件
- 域名 `tarot.lumosai.asia` 已解析到当前服务器公网 IP。
- 宿主机已有 Nginx 占用 80/443（保留，直接复用）。
- Docker / docker compose 已安装可用。

## 1.1 快速实施步骤（Checklist）
1) `docker compose up -d --build backend frontend`（启动并绑定到 127.0.0.1:3701/3702）。  
2) `sudo mkdir -p /var/www/certbot`（ACME 目录）。  
3) 写入 HTTP 版 Nginx 配置 `/etc/nginx/conf.d/tarot.lumosai.asia.conf`，反代 3701/3702，暴露 `/.well-known/acme-challenge/`，`client_max_body_size 50m`。`nginx -t && systemctl reload nginx`。  
4) 申请证书：certbot webroot（`-d tarot.lumosai.asia -w /var/www/certbot`）。  
5) 将同名 conf 更新为 HTTPS 版（80 跳转，443 配置证书并反代前后端）。`nginx -t && systemctl reload nginx`。  
6) 验证：`curl -I https://tarot.lumosai.asia` 与 `/api/health` 均 200。  
7) 续期：`certbot renew --quiet` 后 `systemctl reload nginx`（已自动计划任务，可按需手动执行）。

## 2. 启动项目容器
在项目根目录执行（需先 `npm install` 完成镜像构建依赖）：
```bash
docker compose up -d backend frontend
# backend 暴露 127.0.0.1:3702，frontend 暴露 127.0.0.1:3701
```

## 3. 准备 ACME 目录
```bash
sudo mkdir -p /var/www/certbot
```

## 4. 宿主 Nginx 配置（HTTP 直连，便于申请证书）
新建 `/etc/nginx/conf.d/tarot.lumosai.asia.conf`：
```nginx
upstream ai_tarot_frontend {
    server 127.0.0.1:3701;
    keepalive 64;
}

upstream ai_tarot_backend {
    server 127.0.0.1:3702;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name tarot.lumosai.asia;
    client_max_body_size 50m;

    # ACME 验证目录
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # 后端 API
    location /api/ {
        proxy_pass http://ai_tarot_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 前端
    location / {
        proxy_pass http://ai_tarot_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
测试并重载：
```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 5. 申请证书（webroot）
```bash
sudo docker run --rm \
  -v "/etc/letsencrypt:/etc/letsencrypt" \
  -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
  -v "/var/www/certbot:/var/www/certbot" \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  -d tarot.lumosai.asia \
  --agree-tos --register-unsafely-without-email --non-interactive
```
证书路径：
- `/etc/letsencrypt/live/tarot.lumosai.asia/fullchain.pem`
- `/etc/letsencrypt/live/tarot.lumosai.asia/privkey.pem`

## 6. 切换 HTTPS（强制跳转）
将 `/etc/nginx/conf.d/tarot.lumosai.asia.conf` 更新为：
```nginx
upstream ai_tarot_frontend { server 127.0.0.1:3701; keepalive 64; }
upstream ai_tarot_backend  { server 127.0.0.1:3702; keepalive 64; }

# 80: ACME + 跳转
server {
    listen 80;
    listen [::]:80;
    server_name tarot.lumosai.asia;
    client_max_body_size 50m;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}

# 443: 正式服务
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name tarot.lumosai.asia;
    client_max_body_size 50m;

    ssl_certificate /etc/letsencrypt/live/tarot.lumosai.asia/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tarot.lumosai.asia/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    add_header Strict-Transport-Security "max-age=63072000" always;

    location /.well-known/acme-challenge/ { root /var/www/certbot; }

    location /api/ {
        proxy_pass http://ai_tarot_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://ai_tarot_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
测试并重载：
```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 7. 验证
```bash
# 前端
curl -I https://tarot.lumosai.asia
# 后端健康
curl -I https://tarot.lumosai.asia/api/health
```
期望：均返回 200，HTTP 自动跳转到 HTTPS。

## 8. 续期
certbot 已创建定时任务自动续期。也可手动：
```bash
sudo docker run --rm \
  -v "/etc/letsencrypt:/etc/letsencrypt" \
  -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
  -v "/var/www/certbot:/var/www/certbot" \
  certbot/certbot renew --quiet
sudo systemctl reload nginx
```

## 9. 常见问题
- 80/443 被占用：本方案复用宿主 Nginx，不需停其它站点；仅需确保有 `server_name tarot.lumosai.asia` 的块指向 3701/3702。
- 申请证书失败：检查域名解析、80 端口可达、`/.well-known/acme-challenge` 是否返回 200。
- 前端打不开 / 出现旧站点：清理浏览器缓存或确认宿主 Nginx 生效（`nginx -t` + `systemctl reload nginx`）。

