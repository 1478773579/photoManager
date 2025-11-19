const express = require('express');
const router = express.Router();
const { User, Follow, Photo } = require('../models');
const { authMiddleware } = require('../utils/auth');
const { Op } = require('sequelize');

// 获取用户信息
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Photo,
          as: 'photos',
          attributes: ['id'],
          where: { status: 'active' },
          required: false
        }
      ]
    });

    if (!user || user.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 获取关注统计
    const [followersCount, followingCount] = await Promise.all([
      Follow.count({
        where: {
          followingId: id,
          status: 'active'
        }
      }),
      Follow.count({
        where: {
          followerId: id,
          status: 'active'
        }
      })
    ]);

    // 获取照片统计
    const photosCount = user.photos ? user.photos.length : 0;

    // 如果用户已登录，检查关注状态
    let isFollowing = false;
    if (req.user && req.user.id !== parseInt(id)) {
      const follow = await Follow.findOne({
        where: {
          followerId: req.user.id,
          followingId: id,
          status: 'active'
        }
      });
      isFollowing = !!follow;
    }

    const userResponse = {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      bio: user.bio,
      coverImage: user.coverImage,
      gender: user.gender,
      birthday: user.birthday,
      location: user.location,
      website: user.website,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      stats: {
        photos: photosCount,
        followers: followersCount,
        following: followingCount
      },
      isFollowing
    };

    res.json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

// 更新用户信息
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const {
      nickname,
      bio,
      gender,
      birthday,
      location,
      website
    } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 验证昵称
    if (nickname && (nickname.length < 2 || nickname.length > 20)) {
      return res.status(400).json({
        success: false,
        message: '昵称长度应在2-20个字符之间'
      });
    }

    // 检查昵称是否已被使用
    if (nickname && nickname !== user.nickname) {
      const existingNickname = await User.findOne({
        where: {
          nickname,
          id: { [Op.ne]: req.user.id }
        }
      });
      if (existingNickname) {
        return res.status(400).json({
          success: false,
          message: '该昵称已被使用'
        });
      }
    }

    // 更新用户信息
    await user.update({
      nickname: nickname?.trim() || user.nickname,
      bio: bio?.trim() || user.bio,
      gender: gender || user.gender,
      birthday: birthday || user.birthday,
      location: location?.trim() || user.location,
      website: website?.trim() || user.website
    });

    const userResponse = {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      bio: user.bio,
      coverImage: user.coverImage,
      gender: user.gender,
      birthday: user.birthday,
      location: user.location,
      website: user.website,
      isVerified: user.isVerified
    };

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: userResponse
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '更新用户信息失败'
    });
  }
});

// 更新头像
router.put('/avatar', authMiddleware, async (req, res) => {
  try {
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({
        success: false,
        message: '头像地址不能为空'
      });
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    await user.update({ avatar });

    res.json({
      success: true,
      message: '头像更新成功',
      data: { avatar: user.avatar }
    });
  } catch (error) {
    console.error('更新头像失败:', error);
    res.status(500).json({
      success: false,
      message: '更新头像失败'
    });
  }
});

// 更新封面图
router.put('/cover', authMiddleware, async (req, res) => {
  try {
    const { coverImage } = req.body;

    if (!coverImage) {
      return res.status(400).json({
        success: false,
        message: '封面图地址不能为空'
      });
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    await user.update({ coverImage });

    res.json({
      success: true,
      message: '封面图更新成功',
      data: { coverImage: user.coverImage }
    });
  } catch (error) {
    console.error('更新封面图失败:', error);
    res.status(500).json({
      success: false,
      message: '更新封面图失败'
    });
  }
});

// 搜索用户
router.get('/search/:keyword', async (req, res) => {
  try {
    const { keyword } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!keyword || keyword.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: '搜索关键词至少需要2个字符'
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: users } = await User.findAndCountAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              {
                nickname: {
                  [Op.like]: `%${keyword.trim()}%`
                }
              },
              {
                bio: {
                  [Op.like]: `%${keyword.trim()}%`
                }
              }
            ]
          },
          { status: 'active' }
        ]
      },
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset
    });

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
    console.error('搜索用户失败:', error);
    res.status(500).json({
      success: false,
      message: '搜索用户失败'
    });
  }
});

// 获取当前用户信息
router.get('/me/info', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('获取当前用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

module.exports = router;