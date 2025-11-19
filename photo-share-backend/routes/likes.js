const express = require('express');
const router = express.Router();
const { Like, Photo, Comment, User } = require('../models');
const { authMiddleware } = require('../utils/auth');

// 点赞/取消点赞
router.post('/:targetType/:targetId', authMiddleware, async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const { action = 'like' } = req.body;

    // 验证目标类型
    if (!['photo', 'comment'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: '无效的目标类型'
      });
    }

    // 验证目标是否存在
    let target;
    if (targetType === 'photo') {
      target = await Photo.findByPk(targetId, {
        where: { status: 'active' }
      });
    } else if (targetType === 'comment') {
      target = await Comment.findByPk(targetId, {
        where: { status: 'active' }
      });
    }

    if (!target) {
      return res.status(404).json({
        success: false,
        message: '目标不存在'
      });
    }

    // 检查是否已点赞
    const existingLike = await Like.findOne({
      where: {
        userId: req.user.id,
        targetType,
        targetId
      }
    });

    if (action === 'like') {
      if (existingLike) {
        return res.status(400).json({
          success: false,
          message: '已经点赞过了'
        });
      }

      // 创建点赞记录
      await Like.create({
        userId: req.user.id,
        targetType,
        targetId
      });

      // 更新目标点赞数
      await target.increment('likes');

      res.json({
        success: true,
        message: '点赞成功',
        data: {
          isLiked: true,
          likes: target.likes + 1
        }
      });
    } else {
      // 取消点赞
      if (!existingLike) {
        return res.status(400).json({
          success: false,
          message: '还未点赞'
        });
      }

      // 删除点赞记录
      await existingLike.destroy();

      // 更新目标点赞数
      await target.decrement('likes');

      res.json({
        success: true,
        message: '取消点赞成功',
        data: {
          isLiked: false,
          likes: Math.max(0, target.likes - 1)
        }
      });
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
    res.status(500).json({
      success: false,
      message: '操作失败，请稍后重试'
    });
  }
});

// 获取点赞列表
router.get('/:targetType/:targetId', async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // 验证目标类型
    if (!['photo', 'comment'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: '无效的目标类型'
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: likes } = await Like.findAndCountAll({
      where: {
        targetType,
        targetId
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar', 'isVerified']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        likes,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total: count,
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取点赞列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取点赞列表失败'
    });
  }
});

// 获取用户的点赞记录
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, targetType } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = { userId };

    if (targetType && ['photo', 'comment'].includes(targetType)) {
      whereClause.targetType = targetType;
    }

    const { count, rows: likes } = await Like.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar', 'isVerified']
        },
        ...(targetType === 'photo' ? [{
          model: Photo,
          as: 'photo',
          attributes: ['id', 'title', 'imageUrl', 'thumbnailUrl'],
          where: { status: 'active' }
        }] : []),
        ...(targetType === 'comment' ? [{
          model: Comment,
          as: 'comment',
          attributes: ['id', 'content'],
          where: { status: 'active' },
          include: [{
            model: Photo,
            as: 'photo',
            attributes: ['id', 'title', 'imageUrl', 'thumbnailUrl']
          }]
        }] : [])
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        likes,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total: count,
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取用户点赞记录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户点赞记录失败'
    });
  }
});

// 检查是否已点赞
router.get('/check/:targetType/:targetId', authMiddleware, async (req, res) => {
  try {
    const { targetType, targetId } = req.params;

    // 验证目标类型
    if (!['photo', 'comment'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: '无效的目标类型'
      });
    }

    const like = await Like.findOne({
      where: {
        userId: req.user.id,
        targetType,
        targetId
      }
    });

    res.json({
      success: true,
      data: {
        isLiked: !!like
      }
    });
  } catch (error) {
    console.error('检查点赞状态失败:', error);
    res.status(500).json({
      success: false,
      message: '检查点赞状态失败'
    });
  }
});

module.exports = router;