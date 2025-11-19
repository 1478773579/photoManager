#!/bin/bash

# 图片分享应用后端部署脚本

# 定义颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== 图片分享应用后端部署脚本 ===${NC}"

# 检查是否以root用户运行
if [ "$EUID" -ne 0 ]
  then echo -e "${RED}错误：请以root用户运行此脚本${NC}"
  exit
fi

# 定义变量
APP_DIR="/var/www/photo-share/backend"
ENV_FILE="$APP_DIR/.env"

# 检查应用目录是否存在
if [ ! -d "$APP_DIR" ]; then
  echo -e "${RED}错误：应用目录 $APP_DIR 不存在${NC}"
  echo -e "${YELLOW}请先克隆项目代码到 /var/www/photo-share 目录${NC}"
  exit 1
fi

# 检查环境变量文件是否存在
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${YELLOW}警告：环境变量文件 $ENV_FILE 不存在${NC}"
  echo -e "${YELLOW}正在从 .env.example 创建...${NC}"
  cp "$APP_DIR/.env.example" "$ENV_FILE"
  echo -e "${YELLOW}请编辑 $ENV_FILE 配置环境变量，然后重新运行此脚本${NC}"
  exit 1
fi

# 进入应用目录
cd "$APP_DIR"

echo -e "${GREEN}正在安装依赖...${NC}"
npm install --production

if [ $? -ne 0 ]; then
  echo -e "${RED}依赖安装失败${NC}"
  exit 1
fi

echo -e "${GREEN}正在检查 PM2 是否已安装...${NC}"
if ! command -v pm2 &> /dev/null; then
  echo -e "${YELLOW}PM2 未安装，正在安装...${NC}"
  npm install -g pm2
fi

echo -e "${GREEN}正在启动后端服务...${NC}"
pm2 start server.js --name photo-share-backend

echo -e "${GREEN}正在设置 PM2 开机自启...${NC}"
pm2 startup
pm2 save

echo -e "${GREEN}正在创建上传目录并设置权限...${NC}"
mkdir -p uploads/photos uploads/photo uploads/avatars
chown -R www-data:www-data uploads/
chmod -R 755 uploads/

echo -e "${GREEN}=== 后端部署完成 ===${NC}"
echo -e "${GREEN}服务状态：${NC}"
pm2 status photo-share-backend
echo -e "${GREEN}查看日志：${NC} pm2 logs photo-share-backend"
echo -e "${GREEN}重启服务：${NC} pm2 restart photo-share-backend"
echo -e "${GREEN}停止服务：${NC} pm2 stop photo-share-backend"