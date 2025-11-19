const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 配置存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads', file.fieldname);
    ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 检查文件类型
  if (file.fieldname === 'photo' || file.fieldname === 'photos') {
    // 图片文件
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 JPEG、PNG、GIF、WebP 格式的图片'), false);
    }
  } else if (file.fieldname === 'avatar') {
    // 头像文件
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('头像只支持 JPEG、PNG、WebP 格式'), false);
    }
  } else {
    cb(new Error('不支持的文件字段'), false);
  }
};

// 配置multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 9 // 最多9个文件（与前端保持一致）
  }
});

// 单个图片上传中间件
const uploadPhoto = upload.single('photo');

// 多个图片上传中间件
const uploadPhotos = upload.array('photos', 5);

// 头像上传中间件
const uploadAvatar = upload.single('avatar');

// 获取文件URL
const getFileUrl = (filename, field = 'photo') => {
  return `/uploads/${field}/${filename}`;
};

// 删除文件
const deleteFile = (filePath) => {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('删除文件失败:', error);
    return false;
  }
};

module.exports = {
  uploadPhoto,
  uploadPhotos,
  uploadAvatar,
  getFileUrl,
  deleteFile,
  ensureDir
};