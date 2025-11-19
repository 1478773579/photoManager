<template>
  <div class="login-container">
    <div class="header">
      <h1>欢迎回来</h1>
      <p>登录您的账号</p>
    </div>
    
    <van-form @submit="handleLogin" class="login-form">
      <van-field
        v-model="form.phone"
        type="tel"
        label="手机号"
        placeholder="请输入手机号"
        :rules="[
          { required: true, message: '请输入手机号' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
        ]"
        maxlength="11"
      />
      
      <van-field
        v-model="form.password"
        type="password"
        label="密码"
        placeholder="请输入密码（至少6位）"
        :rules="[
          { required: true, message: '请输入密码' },
          { pattern: /^.{6,}$/, message: '密码长度至少6位' }
        ]"
      />
      
      <div class="form-actions">
        <van-button 
          type="primary" 
          native-type="submit" 
          block 
          :loading="loading"
          class="login-btn"
        >
          登录
        </van-button>
        
        <div class="register-link">
          还没有账号？
          <router-link to="/register">立即注册</router-link>
        </div>
      </div>
    </van-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { showToast } from 'vant'

const router = useRouter()
const userStore = useUserStore()

const form = ref({
  phone: '',
  password: ''
})

const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  
  try {
    const result = await userStore.login(form.value)
    
    if (result.success) {
      showToast('登录成功')
      router.push('/home')
    } else {
      showToast(result.message || '登录失败，请重试')
    }
  } catch (error) {
    console.error('登录错误:', error)
    
    // 根据错误类型显示不同的提示信息
    let errorMessage = '登录失败，请重试'
    
    if (error.message) {
      if (error.message.includes('Network Error') || error.message.includes('ERR_NETWORK')) {
        errorMessage = '网络连接失败，请检查网络后重试'
      } else if (error.message.includes('timeout')) {
        errorMessage = '请求超时，请稍后重试'
      } else if (error.response) {
        // 服务器返回的错误
        const status = error.response.status
        if (status === 401) {
          errorMessage = '手机号或密码错误'
        } else if (status === 404) {
          errorMessage = '用户不存在，请先注册'
        } else if (status === 429) {
          errorMessage = '请求过于频繁，请稍后再试'
        } else if (status >= 500) {
          errorMessage = '服务器错误，请稍后重试'
        }
      }
    }
    
    showToast(errorMessage)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  padding: 60px 20px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
  text-align: center;
  margin-bottom: 60px;
  color: white;
}

.header h1 {
  font-size: 32px;
  margin-bottom: 10px;
}

.header p {
  font-size: 16px;
  opacity: 0.8;
}

.login-form {
  background: white;
  border-radius: 12px;
  padding: 30px 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.form-actions {
  margin-top: 30px;
}

.login-btn {
  height: 50px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 500;
}

.register-link {
  text-align: center;
  margin-top: 20px;
  color: #666;
  font-size: 14px;
}

.register-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}
</style>