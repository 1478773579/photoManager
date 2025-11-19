#!/bin/bash

# 图片分享应用线上服务测试脚本

# 定义颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== 图片分享应用线上服务测试脚本 ===${NC}"

# 检查是否提供了域名
if [ -z "$1" ]; then
  echo -e "${YELLOW}请提供您的域名作为参数，例如：${NC}"
  echo -e "${YELLOW}./test-service.sh your_domain.com${NC}"
  exit 1
fi

# 定义变量
domain=$1
protocol="http"  # 默认使用 HTTP，如果需要测试 HTTPS，请修改为 https

# 检查是否需要使用 HTTPS
read -p "${YELLOW}是否测试 HTTPS？(y/n): ${NC}" use_https
if [[ "$use_https" =~ ^[Yy]$ ]]; then
  protocol="https"
fi

base_url="$protocol://$domain"

# 定义测试函数
run_test() {
  local name="$1"
  local url="$2"
  local method="${3:-GET}"
  local expected_status="${4:-200}"
  local content_type="${5:-}"
  
  echo -ne "${YELLOW}测试 $name... ${NC}"
  
  # 发送请求并获取状态码
  if [ -n "$content_type" ]; then
    status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" -H "Content-Type: $content_type" "$url")
  else
    status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url")
  fi
  
  # 检查状态码是否符合预期
  if [ "$status" -eq "$expected_status" ]; then
    echo -e "${GREEN}✓ 通过${NC}"
    return 0
  else
    echo -e "${RED}✗ 失败${NC}"
    echo -e "${RED}  URL: $url${NC}"
    echo -e "${RED}  方法: $method${NC}"
    echo -e "${RED}  预期状态码: $expected_status${NC}"
    echo -e "${RED}  实际状态码: $status${NC}"
    return 1
  fi
}

# 测试前端页面
echo -e "${GREEN}\n=== 测试前端页面 ===${NC}"
run_test "前端首页" "$base_url"
run_test "404页面" "$base_url/nonexistent-page" 404

# 测试 API 接口
echo -e "${GREEN}\n=== 测试 API 接口 ===${NC}"
run_test "获取照片列表 API" "$base_url/api/photos"
run_test "获取分类列表 API" "$base_url/api/categories"
run_test "获取热门照片 API" "$base_url/api/photos/popular"
run_test "获取首页轮播图 API" "$base_url/api/banners"
run_test "搜索接口 API" "$base_url/api/search?keyword=test"

# 测试静态文件服务
echo -e "${GREEN}\n=== 测试静态文件服务 ===${NC}"

# 测试 CSS 文件（假设存在 main.css）
run_test "CSS 文件" "$base_url/assets/index.css" "GET" 200 "text/css"

# 测试 JavaScript 文件（假设存在 main.js）
run_test "JavaScript 文件" "$base_url/assets/index.js" "GET" 200 "application/javascript"

# 测试图片加载
# 注意：这里需要根据实际情况修改图片路径
echo -e "${YELLOW}\n=== 测试图片加载 ===${NC}"

# 测试批量上传的图片（示例路径，需要根据实际情况修改）
photos_urls=("$base_url/uploads/photos/photos-1763564724247-325434350.png"
            "$base_url/uploads/photo/photo-1763560636830-199253493.jpg")

for photo_url in "${photos_urls[@]}"; do
  filename=$(basename "$photo_url")
  run_test "图片文件 $filename" "$photo_url" "GET" 200 "image/jpeg"
done

# 测试 API 功能完整性
echo -e "${GREEN}\n=== 测试 API 功能完整性 ===${NC}"

# 测试照片详情 API（需要一个有效的照片 ID）
# 首先获取一个照片 ID
photo_id=$(curl -s "$base_url/api/photos?page=1&limit=1" | grep -o '"id":"[0-9]*"' | head -1 | sed 's/"id":"\([0-9]*\)"/\1/')

if [ -n "$photo_id" ]; then
  run_test "照片详情 API" "$base_url/api/photos/$photo_id"
else
  echo -e "${YELLOW}无法获取照片 ID，跳过照片详情 API 测试${NC}"
fi

# 测试分类详情 API（需要一个有效的分类 ID）
category_id=$(curl -s "$base_url/api/categories" | grep -o '"id":"[0-9]*"' | head -1 | sed 's/"id":"\([0-9]*\)"/\1/')

if [ -n "$category_id" ]; then
  run_test "分类详情 API" "$base_url/api/categories/$category_id"
else
  echo -e "${YELLOW}无法获取分类 ID，跳过分类详情 API 测试${NC}"
fi

# 测试性能
echo -e "${GREEN}\n=== 测试性能 ===${NC}"
echo -e "${YELLOW}测量首页加载时间...${NC}"
load_time=$(curl -s -w "%{time_total}" -o /dev/null "$base_url")
echo -e "${GREEN}首页加载时间：${NC}$load_time 秒"

# 总结测试结果
echo -e "${GREEN}\n=== 测试总结 ===${NC}"

# 统计通过和失败的测试
total_tests=$(grep -c "测试 " "$0")
passed_tests=$(grep -c "✓ 通过" "$0")
failed_tests=$((total_tests - passed_tests))

echo -e "${GREEN}总测试数：${NC}$total_tests"
echo -e "${GREEN}通过测试数：${NC}$passed_tests"
echo -e "${RED}失败测试数：${NC}$failed_tests"

# 检查是否有失败的测试
if [ "$failed_tests" -eq 0 ]; then
  echo -e "${GREEN}\n✓ 所有测试通过！您的线上服务运行正常。${NC}"
else
  echo -e "${RED}\n✗ 部分测试失败，请检查相关服务和配置。${NC}"
  echo -e "${YELLOW}建议检查：${NC}"
  echo -e "${YELLOW}1. 后端服务是否正常运行${NC}"
  echo -e "${YELLOW}2. Nginx 配置是否正确${NC}"
  echo -e "${YELLOW}3. 数据库连接是否正常${NC}"
  echo -e "${YELLOW}4. 静态文件权限是否正确${NC}"
  echo -e "${YELLOW}5. 防火墙是否开放了必要的端口${NC}"
  exit 1
fi

echo -e "${GREEN}\n=== 测试完成 ===${NC}"