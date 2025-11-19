const { sequelize } = require('../config/database');
const User = require('./User');
const Photo = require('./Photo');
const Comment = require('./Comment');
const Like = require('./Like');
const Follow = require('./Follow');

// 定义模型关联关系

// 用户与照片的关系 (一对多)
User.hasMany(Photo, {
  foreignKey: 'userId',
  as: 'photos',
  onDelete: 'CASCADE'
});

Photo.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE'
});

// 用户与评论的关系 (一对多)
User.hasMany(Comment, {
  foreignKey: 'userId',
  as: 'comments',
  onDelete: 'CASCADE'
});

Comment.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE'
});

// 照片与评论的关系 (一对多)
Photo.hasMany(Comment, {
  foreignKey: 'photoId',
  as: 'photoComments',
  onDelete: 'CASCADE'
});

Comment.belongsTo(Photo, {
  foreignKey: 'photoId',
  as: 'photo',
  onDelete: 'CASCADE'
});

// 评论的自关联 (回复关系)
Comment.hasMany(Comment, {
  foreignKey: 'parentId',
  as: 'replies',
  onDelete: 'CASCADE'
});

Comment.belongsTo(Comment, {
  foreignKey: 'parentId',
  as: 'parent',
  onDelete: 'CASCADE'
});

// 评论回复用户的关联
Comment.belongsTo(User, {
  foreignKey: 'replyToUserId',
  as: 'replyToUser',
  onDelete: 'SET NULL'
});

// 用户与点赞的关系 (多对多)
User.hasMany(Like, {
  foreignKey: 'userId',
  as: 'likes',
  onDelete: 'CASCADE'
});

Like.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE'
});

// 照片与点赞的关系
Photo.hasMany(Like, {
  foreignKey: 'targetId',
  as: 'photoLikes',
  scope: {
    targetType: 'photo'
  },
  onDelete: 'CASCADE'
});

Like.belongsTo(Photo, {
  foreignKey: 'targetId',
  as: 'photo',
  scope: {
    targetType: 'photo'
  },
  onDelete: 'CASCADE'
});

// 评论与点赞的关系
Comment.hasMany(Like, {
  foreignKey: 'targetId',
  as: 'commentLikes',
  scope: {
    targetType: 'comment'
  },
  onDelete: 'CASCADE'
});

Like.belongsTo(Comment, {
  foreignKey: 'targetId',
  as: 'comment',
  scope: {
    targetType: 'comment'
  },
  onDelete: 'CASCADE'
});

// 用户与关注的关系 (多对多)
User.hasMany(Follow, {
  foreignKey: 'followerId',
  as: 'following',
  onDelete: 'CASCADE'
});

User.hasMany(Follow, {
  foreignKey: 'followingId',
  as: 'followers',
  onDelete: 'CASCADE'
});

Follow.belongsTo(User, {
  foreignKey: 'followerId',
  as: 'follower',
  onDelete: 'CASCADE'
});

Follow.belongsTo(User, {
  foreignKey: 'followingId',
  as: 'following',
  onDelete: 'CASCADE'
});

module.exports = {
  sequelize,
  User,
  Photo,
  Comment,
  Like,
  Follow
};