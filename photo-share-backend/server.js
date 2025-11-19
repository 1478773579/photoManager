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
    let PORT = parseInt(process.env.PORT) || 3000;
    const useAutoPort = process.env.USE_AUTO_PORT === 'true' || PORT === 0;
    
    console.log(`尝试在端口 ${PORT} 启动服务器...`);
    console.log(`PORT变量类型: ${typeof PORT}`);
    console.log(`PORT变量值: ${PORT}`);
    console.log(`是否使用自动分配端口: ${useAutoPort}`);
    
    // 启动服务器的函数
    const startServer = (port) => {
      return new Promise((resolve, reject) => {
        const server = app.listen(port, () => {
          const actualPort = server.address().port;
          resolve({ server, actualPort });
        }).on('error', (err) => {
          reject(err);
        });
      });
    };
    
    // 尝试启动服务器
    startServer(useAutoPort ? 0 : PORT)
      .then(({ server, actualPort }) => {
        console.log(`服务器运行在端口 ${actualPort}`);
        console.log(`API文档: http://localhost:${actualPort}/api`);
        console.log(`健康检查: http://localhost:${actualPort}/api/health`);
        
        // 添加优雅关闭服务器的逻辑
        const shutdown = () => {
          console.log('正在关闭服务器...');
          server.close((err) => {
            if (err) {
              console.error('服务器关闭出错:', err);
              process.exit(1);
            }
            console.log('服务器已成功关闭');
            // 关闭数据库连接
            sequelize.close().then(() => {
              console.log('数据库连接已关闭');
              process.exit(0);
            }).catch((dbErr) => {
              console.error('数据库连接关闭出错:', dbErr);
              process.exit(1);
            });
          });
        };
        
        // 监听终止信号
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
        process.on('SIGQUIT', shutdown);
      })
      .catch((err) => {
        console.error('服务器启动错误:');
        console.error('错误代码:', err.code);
        console.error('错误信息:', err.message);
        console.error('完整错误对象:', err);
        
        if (err.code === 'EADDRINUSE') {
          if (!useAutoPort) {
            console.error(`端口 ${PORT} 已被占用，请尝试其他端口，或设置 USE_AUTO_PORT=true 让系统自动分配端口`);
          } else {
            console.error('系统自动分配端口失败，请检查系统端口使用情况');
          }
        }
        process.exit(1);
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