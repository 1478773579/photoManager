# Photo Share Backend

图片分享社区后端API服务

## 功能特性

- 用户注册登录（JWT认证）
- 图片上传与管理
- 点赞评论系统
- 用户关注系统
- 个人资料管理
- 搜索功能
- 文件上传处理

## 技术栈

- Node.js
- Express.js
- MySQL + Sequelize ORM
- JWT认证
- Multer文件上传
- bcryptjs密码加密

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并配置相应参数：

```bash
cp .env.example .env
```

主要配置项：
- `DB_HOST` - 数据库主机
- `DB_NAME` - 数据库名称
- `DB_USER` - 数据库用户名
- `DB_PASSWORD` - 数据库密码
- `JWT_SECRET` - JWT密钥
- `PORT` - 服务端口

### 3. 启动服务

开发模式：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

## API文档

### 认证相关

#### 注册
```
POST /api/auth/register
Content-Type: application/json

{
  "phone": "13800138000",
  "password": "123456",
  "nickname": "用户昵称"
}
```

#### 登录
```
POST /api/auth/login
Content-Type: application/json

{
  "phone": "13800138000",
  "password": "123456"
}
```

#### 验证Token
```
GET /api/auth/verify
Authorization: Bearer <token>
```

### 图片相关

#### 上传图片
```
POST /api/photos/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

photo: <图片文件>
title: 图片标题
description: 图片描述
tags: 标签数组
category: 分类
location: 位置
camera: 相机
lens: 镜头
settings: 设置JSON
```

#### 获取图片列表
```
GET /api/photos?page=1&limit=20&category=风景&sort=latest&featured=true
```

#### 获取图片详情
```
GET /api/photos/:id
```

#### 删除图片
```
DELETE /api/photos/:id
Authorization: Bearer <token>
```

### 用户相关

#### 获取用户信息
```
GET /api/users/:id
```

#### 更新用户信息
```
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "nickname": "新昵称",
  "bio": "个人简介",
  "gender": "male",
  "location": "北京"
}
```

#### 搜索用户
```
GET /api/users/search/:keyword?page=1&limit=20
```

### 评论相关

#### 发表评论
```
POST /api/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "photoId": 1,
  "content": "评论内容",
  "parentId": null,
  "replyToUserId": null
}
```

#### 获取图片评论
```
GET /api/comments/photo/:photoId?page=1&limit=20&sort=latest
```

#### 删除评论
```
DELETE /api/comments/:id
Authorization: Bearer <token>
```

### 点赞相关

#### 点赞/取消点赞
```
POST /api/likes/:targetType/:targetId
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "like" // 或 "unlike"
}
```

#### 获取点赞列表
```
GET /api/likes/:targetType/:targetId?page=1&limit=20
```

### 关注相关

#### 关注用户
```
POST /api/follows/:followingId
Authorization: Bearer <token>
```

#### 取消关注
```
DELETE /api/follows/:followingId
Authorization: Bearer <token>
```

#### 获取关注列表
```
GET /api/follows/:userId/following?page=1&limit=20
```

#### 获取粉丝列表
```
GET /api/follows/:userId/followers?page=1&limit=20
```

## 数据库设计

### 用户表 (users)
- 基本信息：手机号、昵称、头像、简介等
- 状态管理：激活、禁用、认证状态

### 图片表 (photos)
- 图片信息：标题、描述、URL、尺寸等
- 元数据：标签、分类、位置、设备信息
- 统计数据：点赞数、评论数、浏览数

### 评论表 (comments)
- 评论内容：支持回复和嵌套
- 关联关系：用户、图片、父评论

### 点赞表 (likes)
- 点赞记录：支持图片和评论点赞
- 唯一约束：用户+目标类型+目标ID

### 关注表 (follows)
- 关注关系：关注者、被关注者
- 状态管理：激活、非激活

## 项目结构

```
photo-share-backend/
├── config/
│   └── database.js          # 数据库配置
├── models/
│   ├── User.js             # 用户模型
│   ├── Photo.js            # 图片模型
│   ├── Comment.js          # 评论模型
│   ├── Like.js             # 点赞模型
│   ├── Follow.js           # 关注模型
│   └── index.js            # 模型关联
├── routes/
│   ├── auth.js             # 认证路由
│   ├── users.js            # 用户路由
│   ├── photos.js           # 图片路由
│   ├── comments.js         # 评论路由
│   ├── likes.js            # 点赞路由
│   └── follows.js          # 关注路由
├── utils/
│   ├── auth.js             # 认证工具
│   └── upload.js           # 文件上传工具
├── uploads/                # 上传文件目录
├── app.js                  # Express应用
├── server.js               # 启动文件
├── package.json
└── README.md
```

## 部署说明

1. 确保MySQL数据库已安装并运行
2. 创建数据库并配置连接参数
3. 安装依赖：`npm install --production`
4. 配置环境变量
5. 启动服务：`npm start`

## 安全特性

- JWT Token认证
- 密码bcrypt加密
- 请求频率限制
- 文件上传类型和大小限制
- SQL注入防护（Sequelize ORM）
- XSS防护（helmet中间件）

## 错误处理

统一的错误处理中间件，返回标准格式的错误响应：

```json
{
  "success": false,
  "message": "错误描述",
  "errors": [] // 详细错误信息（验证错误时）
}
```

## 开发说明

- 使用nodemon进行开发热重载
- 支持环境变量配置
- 完整的日志记录
- 数据库迁移和种子数据支持