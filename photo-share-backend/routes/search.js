const express = require('express');
const router = express.Router();
const { Photo, User } = require('../models');
const { Op } = require('sequelize');
const { optionalAuth } = require('../utils/auth');

// 统一搜索接口
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { q, type = 'all', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 如果搜索关键词为空，返回空结果
    if (!q || q.trim() === '') {
      return res.json({
        success: true,
        data: {
          photos: [],
          users: [],
          tags: [],
          pagination: {
            current: parseInt(page),
            pageSize: parseInt(limit),
            total: 0,
            pages: 0
          }
        }
      });
    }

    const searchQuery = q.trim();
    const results = {
      photos: [],
      users: [],
      tags: []
    };

    // 根据类型执行不同的搜索
    switch (type) {
      case 'photos':
        // 搜索照片（标题、描述、标签）
        const { count: photoCount, rows: photos } = await Photo.findAndCountAll({
          where: {
            status: 'active',
            [Op.or]: [
              { title: { [Op.like]: `%${searchQuery}%` } },
              { description: { [Op.like]: `%${searchQuery}%` } },
              { tags: { [Op.like]: `%${searchQuery}%` } }
            ]
          },
          include: [
            { model: User, as: 'user', attributes: ['id', 'nickname', 'avatar', 'isVerified'] }
          ],
          order: [['publishedAt', 'DESC']],
          limit: parseInt(limit),
          offset,
          distinct: true
        });
        results.photos = photos;
        results.pagination = {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total: photoCount,
          pages: Math.ceil(photoCount / parseInt(limit))
        };
        break;

      case 'users':
        // 搜索用户（昵称、介绍）
        const { count: userCount, rows: users } = await User.findAndCountAll({
          where: {
            status: 'active',
            [Op.or]: [
              { nickname: { [Op.like]: `%${searchQuery}%` } },
              { bio: { [Op.like]: `%${searchQuery}%` } }
            ]
          },
          attributes: ['id', 'nickname', 'avatar', 'bio', 'isVerified', 'createdAt'],
          order: [['createdAt', 'DESC']],
          limit: parseInt(limit),
          offset,
          distinct: true
        });
        results.users = users;
        results.pagination = {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total: userCount,
          pages: Math.ceil(userCount / parseInt(limit))
        };
        break;

      case 'tags':
        // 搜索标签
        // 这里可以根据实际需求实现标签搜索
        results.tags = [];
        results.pagination = {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total: 0,
          pages: 0
        };
        break;

      default: // all
        // 搜索所有类型
        const [photoResults, userResults] = await Promise.all([
          // 搜索照片
          Photo.findAndCountAll({
            where: {
              status: 'active',
              [Op.or]: [
                { title: { [Op.like]: `%${searchQuery}%` } },
                { description: { [Op.like]: `%${searchQuery}%` } },
                { tags: { [Op.like]: `%${searchQuery}%` } }
              ]
            },
            include: [
              { model: User, as: 'user', attributes: ['id', 'nickname', 'avatar', 'isVerified'] }
            ],
            order: [['publishedAt', 'DESC']],
            limit: parseInt(limit),
            offset,
            distinct: true
          }),

          // 搜索用户
          User.findAndCountAll({
            where: {
              status: 'active',
              [Op.or]: [
                { nickname: { [Op.like]: `%${searchQuery}%` } },
                { bio: { [Op.like]: `%${searchQuery}%` } }
              ]
            },
            attributes: ['id', 'nickname', 'avatar', 'bio', 'isVerified', 'createdAt'],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset,
            distinct: true
          })
        ]);

        results.photos = photoResults.rows;
        results.users = userResults.rows;
        results.tags = [];
        // 计算总结果数
        const total = photoResults.count + userResults.count;
        results.pagination = {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        };
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('搜索失败:', error);
    res.status(500).json({
      success: false,
      message: '搜索失败，请稍后重试'
    });
  }
});

module.exports = router;