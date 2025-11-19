const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');

// 手机号验证正则
const phoneRegex = /^1[3-9]\d{9}$/;

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { phone, password, nickname } = req.body;

    // 验证必填字段
    if (!phone || !password || !nickname) {
      return res.status(400).json({
        success: false,
        message: '手机号、密码和昵称不能为空'
      });
    }

    // 验证手机号格式
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: '手机号格式不正确'
      });
    }

    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少6位'
      });
    }

    // 验证昵称长度
    if (nickname.length < 2 || nickname.length > 20) {
      return res.status(400).json({
        success: false,
        message: '昵称长度应在2-20个字符之间'
      });
    }

    // 检查手机号是否已注册
    const existingUser = await User.findOne({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '该手机号已注册'
      });
    }

    // 检查昵称是否已被使用
    const existingNickname = await User.findOne({ where: { nickname } });
    if (existingNickname) {
      return res.status(400).json({
        success: false,
        message: '该昵称已被使用'
      });
    }

    // 创建用户
    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      phone,
      password: hashedPassword,
      nickname,
      lastLoginAt: new Date()
    });

    // 生成token
    const token = generateToken(user.id);

    // 返回用户信息（不包含密码）
    const userResponse = {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      bio: user.bio,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    // 验证必填字段
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: '手机号和密码不能为空'
      });
    }

    // 验证手机号格式
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: '手机号格式不正确'
      });
    }

    // 查找用户
    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '手机号或密码错误'
      });
    }

    // 检查用户状态
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: '账号已被禁用，请联系客服'
      });
    }

    // 验证密码
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '手机号或密码错误'
      });
    }

    // 更新最后登录时间
    await user.update({ lastLoginAt: new Date() });

    // 生成token
    const token = generateToken(user.id);

    // 返回用户信息（不包含密码）
    const userResponse = {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      bio: user.bio,
      isVerified: user.isVerified,
      lastLoginAt: user.lastLoginAt
    };

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
});

// 验证token
router.get('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问令牌缺失'
      });
    }

    const { verifyToken } = require('../utils/auth');
    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: '无效的访问令牌'
      });
    }

    res.json({
      success: true,
      message: '令牌有效',
      data: { user }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: '无效的访问令牌'
    });
  }
});

module.exports = router;