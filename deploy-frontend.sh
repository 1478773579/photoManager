#!/bin/bash

# 图片分享应用前端部署脚本

# 定义颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== 图片分享应用前端部署脚本 ===${NC}"

# 检查是否以root用户运行
if [ "$EUID" -ne 0 ]
  then echo -e "${RED}错误：请以root用户运行此脚本${NC}"
  exit
fi

# 定义变量
APP_DIR="/var/www/photo-share/frontend"
BUILD_DIR="$APP_DIR/dist"
NGINX_DIR="/var/www/html"

echo -e "${GREEN}正在检查 Node.js 是否已安装...${NC}"
if ! command -v node &> /dev/null; then
  echo -e "${RED}错误：Node.js 未安装${NC}"
  echo -e "${YELLOW}请先安装 Node.js 18 LTS 版本${NC}"
  exit 1
fi

# 检查应用目录是否存在
if [ ! -d "$APP_DIR" ]; then
  echo -e "${RED}错误：应用目录 $APP_DIR 不存在${NC}"
  echo -e "${YELLOW}请先克隆项目代码到 /var/www/photo-share 目录${NC}"
  exit 1
fi

# 进入应用目录
cd "$APP_DIR"

echo -e "${GREEN}正在安装依赖...${NC}"
npm install

if [ $? -ne 0 ]; then
  echo -e "${RED}依赖安装失败${NC}"
  exit 1
fi

echo -e "${GREEN}正在构建前端项目...${NC}"
npm run build

if [ $? -ne 0 ]; then
  echo -e "${RED}项目构建失败${NC}"
  exit 1
fi

# 检查构建目录是否存在
if [ ! -d "$BUILD_DIR" ]; then
  echo -e "${RED}错误：构建目录 $BUILD_DIR 不存在${NC}"
  exit 1
fi

echo -e "${GREEN}正在将构建结果复制到 Nginx 目录...${NC}"

# 清空 Nginx 目录内容（保留隐藏文件）
find "$NGINX_DIR" -type f -not -path "*/\.*" -delete

# 复制构建结果到 Nginx 目录
cp -r "$BUILD_DIR"/* "$NGINX_DIR/"

echo -e "${GREEN}正在设置文件权限...${NC}"
chown -R www-data:www-data "$NGINX_DIR/"
chmod -R 755 "$NGINX_DIR/"

echo -e "${GREEN}正在重启 Nginx 服务...${NC}"
systemctl restart nginx

echo -e "${GREEN}=== 前端部署完成 ===${NC}"
echo -e "${GREEN}前端应用已部署到：${NC} http://your_domain.com"
echo -e "${GREEN}请确保已配置 Nginx 反向代理${NC}"