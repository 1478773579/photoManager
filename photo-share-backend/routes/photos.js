const express = require('express');
const router = express.Router();
const { Photo, User, Like, Comment, Follow } = require('../models');
const { authMiddleware, optionalAuth } = require('../utils/auth');
const { uploadPhoto, uploadPhotos, getFileUrl } = require('../utils/upload');
const { Op } = require('sequelize');

// 创建图片记录（不包含文件上传）
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, tags, category, location, camera, lens, settings, imageUrl, thumbnailUrl, width, height, fileSize, format } = req.body;

    // 验证必填字段
    if (!title) {
      return res.status(400).json({
        success: false,
        message: '图片标题不能为空'
      });
    }

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: '图片URL不能为空'
      });
    }

    // 处理标签
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        if (!Array.isArray(parsedTags)) {
          parsedTags = [parsedTags];
        }
      } catch (error) {
        parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      }
    }

    // 处理设置
    let parsedSettings = {
      allowComments: true,
      allowDownload: true,
      showExif: false,
      isPublic: true
    };
    if (settings) {
      try {
        parsedSettings = typeof settings === 'string' ? JSON.parse(settings) : settings;
      } catch (error) {
        // 使用默认设置
      }
    }

    // 创建照片记录
    const photo = await Photo.create({
      userId: req.user.id,
      title: title.trim(),
      description: description?.trim() || '',
      imageUrl: imageUrl,
      thumbnailUrl: thumbnailUrl || imageUrl,
      width: width || null,
      height: height || null,
      fileSize: fileSize || null,
      format: format || null,
      tags: parsedTags,
      category: category?.trim() || null,
      location: location?.trim() || null,
      camera: camera?.trim() || null,
      lens: lens?.trim() || null,
      settings: parsedSettings,
      publishedAt: new Date()
    });

    // 返回照片信息
    res.status(201).json({
      success: true,
      message: '图片创建成功',
      data: {
        id: photo.id,
        title: photo.title,
        description: photo.description,
        imageUrl: photo.imageUrl,
        thumbnailUrl: photo.thumbnailUrl,
        width: photo.width,
        height: photo.height,
        fileSize: photo.fileSize,
        format: photo.format,
        tags: photo.tags,
        category: photo.category,
        location: photo.location,
        camera: photo.camera,
        lens: photo.lens,
        settings: photo.settings,
        likes: photo.likes,
        comments: photo.comments,
        views: photo.views,
        publishedAt: photo.publishedAt,
        createdAt: photo.createdAt
      }
    });
  } catch (error) {
    console.error('图片创建失败:', error);
    res.status(500).json({
      success: false,
      message: '图片创建失败，请稍后重试'
    });
  }
});

// 上传单个图片（仅上传文件，不创建记录）
router.post('/upload', authMiddleware, uploadPhoto, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的图片'
      });
    }

    // 只返回文件信息，不创建数据库记录
    res.status(200).json({
      success: true,
      message: '图片上传成功',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        imageUrl: getFileUrl(req.file.filename, 'photo'),
        thumbnailUrl: getFileUrl(req.file.filename, 'photo'), // 可以后续生成缩略图
        width: req.file.width || null,
        height: req.file.height || null,
        fileSize: req.file.size,
        format: req.file.mimetype.split('/')[1]
      }
    });
  } catch (error) {
    console.error('图片上传失败:', error);
    res.status(500).json({
      success: false,
      message: '图片上传失败，请稍后重试'
    });
  }
});

// 批量上传图片
router.post('/upload-multiple', authMiddleware, uploadPhotos, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的图片'
      });
    }

    const { photosData } = req.body;
    let parsedPhotosData = [];
    
    if (photosData) {
      try {
        parsedPhotosData = typeof photosData === 'string' ? JSON.parse(photosData) : photosData;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: '图片数据格式错误'
        });
      }
    }

    const uploadedPhotos = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const photoData = parsedPhotosData[i] || {};

      // 验证必填字段
      if (!photoData.title) {
        return res.status(400).json({
          success: false,
          message: `第${i + 1}张图片的标题不能为空`
        });
      }

      // 处理标签
      let parsedTags = [];
      if (photoData.tags) {
        try {
          parsedTags = typeof photoData.tags === 'string' ? JSON.parse(photoData.tags) : photoData.tags;
          if (!Array.isArray(parsedTags)) {
            parsedTags = [parsedTags];
          }
        } catch (error) {
          parsedTags = photoData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        }
      }

      // 处理设置
      let parsedSettings = {
        allowComments: true,
        allowDownload: true,
        showExif: false,
        isPublic: true
      };
      if (photoData.settings) {
        try {
          parsedSettings = typeof photoData.settings === 'string' ? JSON.parse(photoData.settings) : photoData.settings;
        } catch (error) {
          // 使用默认设置
        }
      }

      const photo = await Photo.create({
        userId: req.user.id,
        title: photoData.title.trim(),
        description: photoData.description?.trim() || '',
        imageUrl: getFileUrl(file.filename, 'photos'),
        thumbnailUrl: getFileUrl(file.filename, 'photos'),
        width: file.width || null,
        height: file.height || null,
        fileSize: file.size,
        format: file.mimetype.split('/')[1],
        tags: parsedTags,
        category: photoData.category?.trim() || null,
        location: photoData.location?.trim() || null,
        camera: photoData.camera?.trim() || null,
        lens: photoData.lens?.trim() || null,
        settings: parsedSettings,
        publishedAt: new Date()
      });

      uploadedPhotos.push({
        id: photo.id,
        title: photo.title,
        description: photo.description,
        imageUrl: photo.imageUrl,
        thumbnailUrl: photo.thumbnailUrl,
        width: photo.width,
        height: photo.height,
        fileSize: photo.fileSize,
        format: photo.format,
        tags: photo.tags,
        category: photo.category,
        location: photo.location,
        camera: photo.camera,
        lens: photo.lens,
        settings: photo.settings,
        likes: photo.likes,
        comments: photo.comments,
        views: photo.views,
        publishedAt: photo.publishedAt,
        createdAt: photo.createdAt
      });
    }

    res.status(201).json({
      success: true,
      message: `成功上传${uploadedPhotos.length}张图片`,
      data: uploadedPhotos
    });
  } catch (error) {
    console.error('批量上传失败:', error);
    res.status(500).json({
      success: false,
      message: '批量上传失败，请稍后重试'
    });
  }
});

// 获取图片列表
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      tags,
      userId,
      sort = 'latest',
      featured
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = { status: 'active' };

    // 筛选条件
    if (category) {
      whereClause.category = category;
    }

    if (userId) {
      whereClause.userId = userId;
    }

    if (featured === 'true') {
      whereClause.featured = true;
    }

    // 标签筛选
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      whereClause[Op.or] = tagArray.map(tag => ({
        tags: {
          [Op.contains]: [tag]
        }
      }));
    }

    // 排序方式
    let order = [];
    switch (sort) {
      case 'popular':
        order = [['likes', 'DESC'], ['views', 'DESC']];
        break;
      case 'trending':
        order = [['views', 'DESC'], ['likes', 'DESC']];
        break;
      case 'oldest':
        order = [['publishedAt', 'ASC']];
        break;
      default: // latest
        order = [['publishedAt', 'DESC']];
    }

    const { count, rows: photos } = await Photo.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar', 'isVerified']
        },
        {
          model: Like,
          as: 'photoLikes',
          required: false,
          where: req.user ? { userId: req.user.id } : undefined,
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'nickname', 'avatar']
          }]
        }
      ],
      order,
      limit: parseInt(limit),
      offset,
      distinct: true
    });

    // 如果用户已登录，检查是否已点赞
    if (req.user) {
      for (const photo of photos) {
        const userLike = await Like.findOne({
          where: {
            userId: req.user.id,
            targetType: 'photo',
            targetId: photo.id
          }
        });
        photo.dataValues.isLiked = !!userLike;
      }
    }

    res.json({
      success: true,
      data: {
        photos,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total: count,
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取图片列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取图片列表失败'
    });
  }
});

// 获取单个图片详情
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const photo = await Photo.findOne({
      where: {
        id,
        status: 'active'
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar', 'bio', 'isVerified']
        },
        {
          model: Comment,
          as: 'photoComments',
          where: { status: 'active' },
          required: false,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'nickname', 'avatar', 'isVerified']
            },
            {
              model: Comment,
              as: 'replies',
              where: { status: 'active' },
              required: false,
              include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'nickname', 'avatar', 'isVerified']
              }]
            }
          ],
          order: [['createdAt', 'ASC']]
        }
      ]
    });

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: '图片不存在'
      });
    }

    // 增加浏览量
    await photo.increment('views');

    // 如果用户已登录，检查是否已点赞和关注作者
    if (req.user) {
      // 检查是否已点赞
      const userLike = await Like.findOne({
        where: {
          userId: req.user.id,
          targetType: 'photo',
          targetId: photo.id
        }
      });
      photo.dataValues.isLiked = !!userLike;
      
      // 检查是否已关注作者
      if (req.user.id !== photo.userId) {
        const userFollow = await Follow.findOne({
          where: {
            followerId: req.user.id,
            followingId: photo.userId,
            status: 'active'
          }
        });
        photo.user.dataValues.isFollowing = !!userFollow;
      }
    }

    res.json({
      success: true,
      data: photo
    });
  } catch (error) {
    console.error('获取图片详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取图片详情失败'
    });
  }
});

// 获取用户照片列表
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, sort = 'latest' } = req.query;

    // 验证用户是否存在
    const user = await User.findByPk(userId, {
      where: { status: 'active' }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 排序方式
    let order = [];
    switch (sort) {
      case 'popular':
        order = [['likes', 'DESC'], ['views', 'DESC']];
        break;
      case 'trending':
        order = [['views', 'DESC'], ['likes', 'DESC']];
        break;
      case 'oldest':
        order = [['publishedAt', 'ASC']];
        break;
      default: // latest
        order = [['publishedAt', 'DESC']];
    }

    const { count, rows: photos } = await Photo.findAndCountAll({
      where: {
        userId,
        status: 'active'
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar', 'isVerified']
        }
      ],
      order,
      limit: parseInt(limit),
      offset,
      distinct: true
    });

    res.json({
      success: true,
      data: {
        photos,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total: count,
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取用户照片失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户照片失败'
    });
  }
});

// 获取用户获赞作品列表
router.get('/user/:userId/liked', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // 验证用户是否存在
    const user = await User.findByPk(userId, {
      where: { status: 'active' }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 获取用户的作品，按获赞数排序
    const { count, rows: photos } = await Photo.findAndCountAll({
      where: {
        userId,
        status: 'active',
        likes: { [Op.gt]: 0 } // 只显示有获赞的作品
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar', 'isVerified']
        }
      ],
      order: [['likes', 'DESC'], ['publishedAt', 'DESC']],
      limit: parseInt(limit),
      offset,
      distinct: true
    });

    // 计算统计数据
    const statsQuery = await Photo.findOne({
      where: {
        userId,
        status: 'active'
      },
      attributes: [
        [require('sequelize').fn('SUM', require('sequelize').col('likes')), 'totalLikes'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'totalPhotos']
      ],
      raw: true
    });

    const stats = {
      totalLikes: parseInt(statsQuery.totalLikes) || 0,
      totalPhotos: parseInt(statsQuery.totalPhotos) || 0
    };

    res.json({
      success: true,
      data: {
        photos,
        stats,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total: count,
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取用户获赞作品失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户获赞作品失败'
    });
  }
});

// 删除图片
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const photo = await Photo.findOne({
      where: {
        id,
        userId: req.user.id,
        status: 'active'
      }
    });

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: '图片不存在或无权限删除'
      });
    }

    // 软删除
    await photo.update({ status: 'deleted' });

    res.json({
      success: true,
      message: '图片删除成功'
    });
  } catch (error) {
    console.error('删除图片失败:', error);
    res.status(500).json({
      success: false,
      message: '删除图片失败'
    });
  }
});

// 更新图片信息
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, tags, category, location, camera, lens, settings } = req.body;

    const photo = await Photo.findOne({
      where: {
        id,
        userId: req.user.id,
        status: 'active'
      }
    });

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: '图片不存在或无权限修改'
      });
    }

    // 处理标签
    let parsedTags = photo.tags;
    if (tags !== undefined) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        if (!Array.isArray(parsedTags)) {
          parsedTags = [parsedTags];
        }
      } catch (error) {
        parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      }
    }

    // 处理设置
    let parsedSettings = photo.settings;
    if (settings !== undefined) {
      try {
        parsedSettings = typeof settings === 'string' ? JSON.parse(settings) : settings;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: '设置格式错误'
        });
      }
    }

    // 更新图片信息
    await photo.update({
      title: title?.trim() || photo.title,
      description: description?.trim() || photo.description,
      tags: parsedTags,
      category: category?.trim() || photo.category,
      location: location?.trim() || photo.location,
      camera: camera?.trim() || photo.camera,
      lens: lens?.trim() || photo.lens,
      settings: parsedSettings
    });

    res.json({
      success: true,
      message: '图片信息更新成功',
      data: photo
    });
  } catch (error) {
    console.error('更新图片失败:', error);
    res.status(500).json({
      success: false,
      message: '更新图片失败'
    });
  }
});

module.exports = router;