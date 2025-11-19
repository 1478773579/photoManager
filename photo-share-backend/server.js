require('dotenv').config();
const { sequelize, testConnection, syncDatabase } = require('./config/database');
const app = require('./app');

// 启动应用
const startApp = async () => {
  try {
    // 测试数据库连接
    await testConnection();
    
    // 同步数据库模型
    await syncDatabase();
    
    console.log('应用初始化完成');
    
    // 启动HTTP服务器
    let PORT = process.env.PORT || 3000;
    
    // 如果PORT为0，让系统自动分配端口
    const server = app.listen(PORT, () => {
      const actualPort = server.address().port;
      console.log(`服务器运行在端口 ${actualPort}`);
      console.log(`API文档: http://localhost:${actualPort}/api`);
      console.log(`健康检查: http://localhost:${actualPort}/api/health`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`端口 ${PORT} 已被占用，请尝试其他端口`);
        process.exit(1);
      } else {
        throw err;
      }
    });
    
  } catch (error) {
    console.error('应用初始化失败:', error);
    process.exit(1);
  }
};

// 如果直接运行此文件，则启动应用
if (require.main === module) {
  startApp();
}

module.exports = { startApp };