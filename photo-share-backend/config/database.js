require('dotenv').config();
const { Sequelize } = require('sequelize');

// 数据库配置
const isProduction = process.env.NODE_ENV === 'production';
const dbType = process.env.DB_TYPE || 'mysql';

let sequelize;

if (dbType === 'sqlite') {
  // 开发环境使用SQLite
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './database.sqlite',
    logging: !isProduction ? console.log : false,
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    }
  });
} else {
  // 生产环境使用MySQL
  sequelize = new Sequelize(
    process.env.DB_NAME || 'photo_share',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      dialect: 'mysql',
      port: process.env.DB_PORT || 3306,
      logging: !isProduction ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: false,
        freezeTableName: true
      }
    }
  );
}

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
  } catch (error) {
    console.error('数据库连接失败:', error);
  }
};

// 同步数据库模型
const syncDatabase = async () => {
  try {
    await sequelize.sync({ force: false });
    console.log('数据库模型同步完成');
  } catch (error) {
    console.error('数据库模型同步失败:', error);
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
};