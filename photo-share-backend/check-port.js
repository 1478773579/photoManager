const net = require('net');

const PORT = 61608;
const HOST = '127.0.0.1';

// 创建一个TCP服务器来测试端口是否可用
const server = net.createServer();

server.listen(PORT, HOST, () => {
  console.log(`端口 ${PORT} 可用，可以绑定`);
  server.close(() => {
    console.log(`已释放端口 ${PORT}`);
  });
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`端口 ${PORT} 确实被占用`);
    
    // 尝试获取占用该端口的进程信息
    const exec = require('child_process').exec;
    exec(`netstat -aon | findstr :${PORT}`, (error, stdout, stderr) => {
      if (stdout) {
        console.log('端口占用详情:');
        console.log(stdout);
        
        // 提取PID
        const pidMatch = stdout.match(/\s+(\d+)$/);
        if (pidMatch && pidMatch[1]) {
          const pid = pidMatch[1];
          console.log(`\n占用进程的PID: ${pid}`);
          
          // 获取进程详情
          exec(`tasklist /FI "PID eq ${pid}"`, (taskError, taskStdout, taskStderr) => {
            if (taskStdout) {
              console.log('进程详情:');
              console.log(taskStdout);
            } else {
              console.log(`无法获取PID为 ${pid} 的进程详情`);
            }
          });
        }
      } else {
        console.log('无法获取占用进程信息');
        console.log(`错误信息: ${err.message}`);
      }
    });
  } else {
    console.log(`检查端口时出错: ${err.message}`);
  }
});