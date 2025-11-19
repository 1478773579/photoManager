# SSL 证书配置指南

本指南将帮助您为图片分享应用配置 HTTPS，使用 Let's Encrypt 提供的免费 SSL 证书。

## 前提条件

- 您已经拥有一个域名，并且已经将域名解析到您的服务器 IP 地址
- 您的服务器上已经安装并运行了 Nginx
- 您的防火墙已经开放了 80 和 443 端口

## 安装 Certbot

Certbot 是 Let's Encrypt 官方推荐的证书管理工具，我们将使用它来获取和管理 SSL 证书。

### 在 Ubuntu 系统上安装

```bash
# 更新包列表
sudo apt update

# 安装 Certbot 和 Nginx 插件
sudo apt install certbot python3-certbot-nginx
```

### 在 CentOS 系统上安装

```bash
# 安装 EPEL 仓库
sudo yum install epel-release

# 安装 Certbot 和 Nginx 插件
sudo yum install certbot python3-certbot-nginx
```

## 获取 SSL 证书

使用 Certbot 的 Nginx 插件可以自动获取证书并配置 Nginx：

```bash
sudo certbot --nginx -d your_domain.com -d www.your_domain.com
```

在执行过程中，您需要：
1. 输入您的电子邮件地址（用于证书过期提醒）
2. 同意 Let's Encrypt 的服务条款
3. 选择是否分享您的电子邮件地址
4. 选择是否将 HTTP 请求重定向到 HTTPS

## 验证证书安装

安装完成后，您可以通过以下方式验证证书是否正确安装：

1. 在浏览器中访问 `https://your_domain.com`，检查地址栏是否显示绿色的锁图标
2. 使用 SSL Labs 在线工具进行检测：https://www.ssllabs.com/ssltest/

## 自动续期证书

Let's Encrypt 的证书有效期为 90 天，Certbot 会自动安装一个 cron 任务来定期检查证书是否需要续期。您可以通过以下命令手动测试续期功能：

```bash
sudo certbot renew --dry-run
```

如果测试成功，您将看到类似以下的输出：

```
Congratulations, all simulated renewals succeeded: 
  /etc/letsencrypt/live/your_domain.com/fullchain.pem (success)
```

## 手动配置 Nginx SSL（可选）

如果您选择手动配置 Nginx SSL，可以使用以下示例配置：

```nginx
server {
    listen 443 ssl http2;
    server_name your_domain.com www.your_domain.com;

    # SSL 证书配置
    ssl_certificate /etc/letsencrypt/live/your_domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your_domain.com/privkey.pem;

    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # 前端静态文件配置
    location / {
        root /var/www/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # API 请求代理配置
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 文件上传目录代理配置
    location /uploads/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 将 HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;
    return 301 https://$server_name$request_uri;
}
```

配置完成后，重启 Nginx 服务：

```bash
sudo systemctl restart nginx
```

## 测试 HTTPS 配置

1. 访问 `https://your_domain.com`，确保网站可以正常加载
2. 检查地址栏是否显示绿色的锁图标
3. 使用 `curl` 命令测试 API 接口：

```bash
curl -X GET https://your_domain.com/api/photos --verbose
```

确保响应头中包含 `HTTP/1.1 200 OK` 和 `Strict-Transport-Security` 头部。

## 常见问题排查

1. **证书获取失败**
   - 确保您的域名已经正确解析到服务器 IP
   - 确保您的服务器防火墙已经开放了 80 和 443 端口
   - 确保 Nginx 配置中的 `server_name` 与您的域名匹配

2. **HTTPS 页面无法加载**
   - 检查 Nginx 配置文件中的 SSL 证书路径是否正确
   - 检查 SSL 证书文件的权限是否正确
   - 查看 Nginx 错误日志：`sudo tail -f /var/log/nginx/error.log`

3. **混合内容警告**
   - 确保您的前端代码中所有资源（图片、CSS、JavaScript）都使用 HTTPS 链接
   - 检查数据库中存储的图片 URL 是否使用了 HTTPS

## 结论

通过本指南，您已经成功为图片分享应用配置了 HTTPS，提高了应用的安全性。Let's Encrypt 证书会自动续期，您无需手动管理证书的有效期。