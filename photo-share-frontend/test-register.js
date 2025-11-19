// 测试注册功能
const testRegister = async () => {
    const testData = {
        phone: "13800138005",
        password: "123456", 
        nickname: "测试用户5"
    };

    try {
        console.log('正在测试注册功能...');
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log('✅ 注册成功!');
            console.log('用户信息:', result.data.user);
            console.log('Token:', result.data.token.substring(0, 50) + '...');
        } else {
            console.log('❌ 注册失败:', result.message);
        }
    } catch (error) {
        console.error('❌ 网络错误:', error.message);
    }
};

// 在浏览器控制台运行: testRegister()