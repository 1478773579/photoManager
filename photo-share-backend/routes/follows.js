const express = require('express');
const router = express.Router();
const { Follow, User } = require('../models');
const { authMiddleware } = require('../utils/auth');
const { Op } = require('sequelize');

// 关注用户
router.post('/:followingId', authMiddleware, async (req, res) => {
  try {
    const { followingId } = req.params;

    // 不能关注自己
    if (parseInt(followingId) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能关注自己'
      });
    }

    // 检查目标用户是否存在
    const targetUser = await User.findByPk(followingId, {
      where: { status: 'active' }
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 检查是否已关注
    const existingFollow = await Follow.findOne({
      where: {
        followerId: req.user.id,
        followingId,
        status: 'active'
      }
    });

    if (existingFollow) {
      return res.status(400).json({
        success: false,
        message: '已经关注了该用户'
      });
    }

    // 创建关注记录
    await Follow.create({
      followerId: req.user.id,
      followingId,
      status: 'active'
    });

    res.json({
      success: true,
      message: '关注成功',
      data: {
        isFollowing: true
      }
    });
  } catch (error) {
    console.error('关注失败:', error);
    res.status(500).json({
      success: false,
      message: '关注失败，请稍后重试'
    });
  }
});

// 取消关注
router.delete('/:followingId', authMiddleware, async (req, res) => {
  try {
    const { followingId } = req.params;

    // 检查关注记录是否存在
    const follow = await Follow.findOne({
      where: {
        followerId: req.user.id,
        followingId,
        status: 'active'
      }
    });

    if (!follow) {
      return res.status(400).json({
        success: false,
        message: '未关注该用户'
      });
    }

    // 更新关注状态为非活跃
    await follow.update({ status: 'inactive' });

    res.json({
      success: true,
      message: '取消关注成功',
      data: {
        isFollowing: false
      }
    });
  } catch (error) {
    console.error('取消关注失败:', error);
    res.status(500).json({
      success: false,
      message: '取消关注失败，请稍后重试'
    });
  }
});

// 获取用户的关注列表
router.get('/:userId/following', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: follows } = await Follow.findAndCountAll({
      where: {
        followerId: userId,
        status: 'active'
      },
      include: [
        {
          model: User,
          as: 'following',
          attributes: ['id', 'nickname', 'avatar', 'bio', 'isVerified'],
          where: { status: 'active' }
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    // 如果用户已登录，检查关注状态
    if (req.user) {
      for (const follow of follows) {
        const isFollowing = await Follow.findOne({
          where: {
            followerId: req.user.id,
            followingId: follow.following.id,
            status: 'active'
          }
        });
        follow.following.dataValues.isFollowing = !!isFollowing;
      }
    }

    res.json({
      success: true,
      data: {
        follows: follows.map(f => f.following),
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total: count,
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取关注列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取关注列表失败'
    });
  }
});

// 获取用户的粉丝列表
router.get('/:userId/followers', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: follows } = await Follow.findAndCountAll({
      where: {
        followingId: userId,
        status: 'active'
      },
      include: [
        {
          model: User,
          as: 'follower',
          attributes: ['id', 'nickname', 'avatar', 'bio', 'isVerified'],
          where: { status: 'active' }
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    // 如果用户已登录，检查关注状态
    if (req.user) {
      for (const follow of follows) {
        const isFollowing = await Follow.findOne({
          where: {
            followerId: req.user.id,
            followingId: follow.follower.id,
            status: 'active'
          }
        });
        follow.follower.dataValues.isFollowing = !!isFollowing;
      }
    }

    res.json({
      success: true,
      data: {
        follows: follows.map(f => f.follower),
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total: count,
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取粉丝列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取粉丝列表失败'
    });
  }
});

// 检查关注状态
router.get('/check/:followingId', authMiddleware, async (req, res) => {
  try {
    const { followingId } = req.params;

    const follow = await Follow.findOne({
      where: {
        followerId: req.user.id,
        followingId,
        status: 'active'
      }
    });

    res.json({
      success: true,
      data: {
        isFollowing: !!follow
      }
    });
  } catch (error) {
    console.error('检查关注状态失败:', error);
    res.status(500).json({
      success: false,
      message: '检查关注状态失败'
    });
  }
});

// 获取共同关注
router.get('/:userId/mutual', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 获取当前用户关注的用户ID列表
    const currentUserFollowing = await Follow.findAll({
      where: {
        followerId: req.user.id,
        status: 'active'
      },
      attributes: ['followingId']
    });

    const currentUserFollowingIds = currentUserFollowing.map(f => f.followingId);

    // 获取目标用户关注的用户
    const { count, rows: follows } = await Follow.findAndCountAll({
      where: {
        followerId: userId,
        followingId: {
          [Op.in]: currentUserFollowingIds
        },
        status: 'active'
      },
      include: [
        {
          model: User,
          as: 'following',
          attributes: ['id', 'nickname', 'avatar', 'bio', 'isVerified'],
          where: { status: 'active' }
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        follows: follows.map(f => f.following),
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total: count,
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取共同关注失败:', error);
    res.status(500).json({
      success: false,
      message: '获取共同关注失败'
    });
  }
});

// 获取关注推荐
router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 获取当前用户关注的用户
    const currentUserFollowing = await Follow.findAll({
      where: {
        followerId: req.user.id,
        status: 'active'
      },
      attributes: ['followingId']
    });

    const currentUserFollowingIds = currentUserFollowing.map(f => f.followingId);
    currentUserFollowingIds.push(req.user.id); // 排除自己

    // 获取关注用户关注的用户（二度人脉）
    const secondDegreeFollows = await Follow.findAll({
      where: {
        followerId: {
          [Op.in]: currentUserFollowingIds
        },
        followingId: {
          [Op.notIn]: currentUserFollowingIds
        },
        status: 'active'
      },
      attributes: [
        'followingId',
        [sequelize.fn('COUNT', sequelize.col('followingId')), 'count']
      ],
      group: ['followingId'],
      order: [[sequelize.literal('count'), 'DESC']],
      limit: parseInt(limit) * 3 // 获取更多候选，后续筛选
    });

    const recommendedUserIds = secondDegreeFollows.map(f => f.followingId);

    // 获取推荐用户详情
    const { count, rows: users } = await User.findAndCountAll({
      where: {
        id: {
          [Op.in]: recommendedUserIds
        },
        status: 'active'
      },
      attributes: ['id', 'nickname', 'avatar', 'bio', 'isVerified'],
      limit: parseInt(limit),
      offset
    });

    // 检查关注状态
    for (const user of users) {
      const isFollowing = await Follow.findOne({
        where: {
          followerId: req.user.id,
          followingId: user.id,
          status: 'active'
        }
      });
      user.dataValues.isFollowing = !!isFollowing;
    }

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total: count,
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取关注推荐失败:', error);
    res.status(500).json({
      success: false,
      message: '获取关注推荐失败'
    });
  }
});

module.exports = router;