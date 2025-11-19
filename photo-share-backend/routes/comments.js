const express = require('express');
const router = express.Router();
const { Comment, Photo, User, Like } = require('../models');
const { authMiddleware, optionalAuth } = require('../utils/auth');
const { Op } = require('sequelize');

// 发表评论
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { photoId, content, parentId, replyToUserId } = req.body;

    // 验证必填字段
    if (!photoId || !content) {
      return res.status(400).json({
        success: false,
        message: '图片ID和评论内容不能为空'
      });
    }

    // 验证内容长度
    if (content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '评论内容不能为空'
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        message: '评论内容不能超过1000个字符'
      });
    }

    // 验证图片是否存在
    const photo = await Photo.findByPk(photoId, {
      where: { status: 'active' }
    });

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: '图片不存在'
      });
    }

    // 验证父评论是否存在（如果是回复）
    let parentComment = null;
    if (parentId) {
      parentComment = await Comment.findByPk(parentId, {
        where: { 
          status: 'active',
          photoId 
        }
      });

      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: '父评论不存在'
        });
      }
    }

    // 验证回复用户是否存在
    if (replyToUserId) {
      const replyUser = await User.findByPk(replyToUserId);
      if (!replyUser) {
        return res.status(404).json({
          success: false,
          message: '回复的用户不存在'
        });
      }
    }

    // 创建评论
    const comment = await Comment.create({
      userId: req.user.id,
      photoId,
      content: content.trim(),
      parentId: parentId || null,
      replyToUserId: replyToUserId || null
    });

    // 更新图片评论数
    await photo.increment('comments');

    // 获取完整的评论信息
    const fullComment = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar', 'isVerified']
        },
        {
          model: Comment,
          as: 'parent',
          attributes: ['id', 'content'],
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'nickname', 'avatar']
          }]
        },
        {
          model: User,
          as: 'replyToUser',
          attributes: ['id', 'nickname', 'avatar']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: '评论发表成功',
      data: fullComment
    });
  } catch (error) {
    console.error('发表评论失败:', error);
    res.status(500).json({
      success: false,
      message: '发表评论失败，请稍后重试'
    });
  }
});

// 获取图片的评论列表
router.get('/photo/:photoId', optionalAuth, async (req, res) => {
  try {
    const { photoId } = req.params;
    const { page = 1, limit = 20, sort = 'latest' } = req.query;

    // 验证图片是否存在
    const photo = await Photo.findByPk(photoId, {
      where: { status: 'active' }
    });

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: '图片不存在'
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 排序方式
    let order = [];
    switch (sort) {
      case 'popular':
        order = [['likes', 'DESC'], ['createdAt', 'DESC']];
        break;
      default: // latest
        order = [['createdAt', 'ASC']]; // 评论按时间正序，方便显示回复关系
    }

    const { count, rows: comments } = await Comment.findAndCountAll({
      where: {
        photoId,
        parentId: null, // 只获取顶级评论
        status: 'active'
      },
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
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'nickname', 'avatar', 'isVerified']
            },
            {
              model: User,
              as: 'replyToUser',
              attributes: ['id', 'nickname', 'avatar']
            }
          ],
          order: [['createdAt', 'ASC']]
        }
      ],
      order,
      limit: parseInt(limit),
      offset
    });

    // 如果用户已登录，检查点赞状态
    if (req.user) {
      for (const comment of comments) {
        const userLike = await Like.findOne({
          where: {
            userId: req.user.id,
            targetType: 'comment',
            targetId: comment.id
          }
        });
        comment.dataValues.isLiked = !!userLike;

        // 检查回复的点赞状态
        if (comment.replies) {
          for (const reply of comment.replies) {
            const replyLike = await Like.findOne({
              where: {
                userId: req.user.id,
                targetType: 'comment',
                targetId: reply.id
              }
            });
            reply.dataValues.isLiked = !!replyLike;
          }
        }
      }
    }

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total: count,
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取评论列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取评论列表失败'
    });
  }
});

// 删除评论
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findByPk(id, {
      include: [
        {
          model: Photo,
          as: 'photo',
          attributes: ['id', 'userId']
        }
      ]
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }

    // 检查权限（评论作者或图片作者可以删除）
    if (comment.userId !== req.user.id && comment.photo.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限删除此评论'
      });
    }

    // 软删除评论
    await comment.update({ status: 'deleted' });

    // 如果是顶级评论，同时删除所有回复
    if (!comment.parentId) {
      await Comment.update(
        { status: 'deleted' },
        {
          where: {
            parentId: id,
            status: 'active'
          }
        }
      );
    }

    // 更新图片评论数
    const totalComments = await Comment.count({
      where: {
        photoId: comment.photoId,
        status: 'active'
      }
    });
    
    await comment.photo.update({ comments: totalComments });

    res.json({
      success: true,
      message: '评论删除成功'
    });
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({
      success: false,
      message: '删除评论失败'
    });
  }
});

// 更新评论
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '评论内容不能为空'
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        message: '评论内容不能超过1000个字符'
      });
    }

    const comment = await Comment.findByPk(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }

    // 检查权限
    if (comment.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限修改此评论'
      });
    }

    // 更新评论
    await comment.update({ content: content.trim() });

    // 返回更新后的评论
    const updatedComment = await Comment.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar', 'isVerified']
        }
      ]
    });

    res.json({
      success: true,
      message: '评论更新成功',
      data: updatedComment
    });
  } catch (error) {
    console.error('更新评论失败:', error);
    res.status(500).json({
      success: false,
      message: '更新评论失败'
    });
  }
});

// 获取评论详情
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findByPk(id, {
      where: { status: 'active' },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar', 'isVerified']
        },
        {
          model: Photo,
          as: 'photo',
          attributes: ['id', 'title', 'imageUrl', 'thumbnailUrl']
        },
        {
          model: Comment,
          as: 'parent',
          attributes: ['id', 'content'],
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'nickname', 'avatar']
          }]
        },
        {
          model: User,
          as: 'replyToUser',
          attributes: ['id', 'nickname', 'avatar']
        }
      ]
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }

    // 如果用户已登录，检查点赞状态
    if (req.user) {
      const userLike = await Like.findOne({
        where: {
          userId: req.user.id,
          targetType: 'comment',
          targetId: comment.id
        }
      });
      comment.dataValues.isLiked = !!userLike;
    }

    res.json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('获取评论详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取评论详情失败'
    });
  }
});

module.exports = router;