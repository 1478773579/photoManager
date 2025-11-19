# 图片分享应用线上部署指南

## 一、服务器环境准备

### 1. 操作系统选择
推荐使用 Ubuntu 20.04 LTS 或 CentOS 7/8，本文以 Ubuntu 20.04 LTS 为例。

### 2. 安装 Node.js
```bash
# 更新系统包
apt update && apt upgrade -y

# 安装 Node.js 18 (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 验证安装
node -v
npm -v
```

### 3. 安装数据库

#### 生产环境使用 MySQL
```bash
# 安装 MySQL
apt install -y mysql-server

# 安全配置
mysql_secure_installation

# 创建数据库和用户
mysql -u root -p
CREATE DATABASE photo_share CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'photo_share_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON photo_share.* TO 'photo_share_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 开发环境可使用 SQLite
生产环境不推荐使用 SQLite，仅用于开发和测试。

### 4. 安装 Nginx
```bash
apt install -y nginx
```

### 5. 安装 PM2
```bash
npm install -g pm2
```

## 二、项目部署

### 1. 克隆项目代码
```bash
# 创建项目目录
mkdir -p /var/www/photo-share
cd /var/www/photo-share

# 克隆代码（假设使用 Git）
git clone your_repository_url .
```

### 2. 配置环境变量

#### 后端环境变量
```bash
# 创建 .env 文件
cp backend/.env.example backend/.env

# 编辑环境变量
nano backend/.env
```

环境变量配置示例：
```
# 环境配置
NODE_ENV=production
PORT=3000

# 数据库配置（生产环境使用 MySQL）
DB_TYPE=mysql
DB_NAME=photo_share
DB_USER=photo_share_user
DB_PASSWORD=your_strong_password
DB_HOST=localhost
DB_PORT=3306

# JWT配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# 文件上传配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# CORS配置
CORS_ORIGIN=https://your_domain.com
```

### 3. 部署后端服务

```bash
# 进入后端目录
cd /var/www/photo-share/backend

# 安装依赖
npm install --production

# 启动服务（使用 PM2）
pm2 start server.js --name photo-share-backend

# 设置开机自启
pm2 startup
pm2 save
```

### 4. 构建并部署前端项目

```bash
# 进入前端目录
cd /var/www/photo-share/frontend

# 安装依赖
npm install

# 构建项目
npm run build

# 将构建结果复制到 Nginx 静态目录
cp -r dist/* /var/www/html/
```

## 三、Nginx 配置

### 1. 配置反向代理

```bash
# 创建配置文件
nano /etc/nginx/sites-available/photo-share
```

配置内容：
```nginx
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;

    # 前端静态文件
    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 文件上传目录代理
    location /uploads {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. 启用配置

```bash
# 创建软链接
ln -s /etc/nginx/sites-available/photo-share /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
```

## 四、SSL 证书配置（可选）

### 使用 Let's Encrypt 配置 HTTPS

```bash
# 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 获取证书
certbot --nginx -d your_domain.com -d www.your_domain.com

# 设置自动续期
certbot renew --dry-run
```

## 五、测试服务可用性

### 1. 检查后端服务状态
```bash
pm2 status
pm2 logs photo-share-backend
```

### 2. 测试 API 接口
```bash
curl -X GET http://localhost:3000/api/health
```

### 3. 访问前端页面
在浏览器中访问：`http://your_domain.com`

## 六、日常维护

### 1. 查看日志
```bash
# 后端日志
pm2 logs photo-share-backend

# Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 2. 更新代码
```bash
cd /var/www/photo-share
git pull

# 重启服务
pm2 restart photo-share-backend
```

### 3. 备份数据库
```bash
mysqldump -u photo_share_user -p photo_share > photo_share_backup_$(date +%Y%m%d).sql
```

## 七、常见问题排查

1. **API 接口返回 502 Bad Gateway**：检查后端服务是否正常运行，PM2 状态是否正常。
2. **前端页面无法加载**：检查 Nginx 配置和静态文件路径是否正确。
3. **数据库连接失败**：检查数据库配置和权限设置是否正确。
4. **文件上传失败**：检查上传目录权限和文件大小限制。

# 部署完成！