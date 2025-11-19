<template>
  <div class="register-container">
    <van-nav-bar
      title="注册"
      left-arrow
      @click-left="$router.go(-1)"
      class="nav-bar"
    />
    
    <div class="content">
      <van-form @submit="handleRegister" class="register-form">
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
          placeholder="请设置密码（至少6位）"
          :rules="[
            { required: true, message: '请设置密码' },
            { pattern: /^.{6,}$/, message: '密码长度至少6位' }
          ]"
        />
        
        <van-field
          v-model="form.confirmPassword"
          type="password"
          label="确认密码"
          placeholder="请再次输入密码"
          :rules="[
            { required: true, message: '请确认密码' },
            { validator: validatePassword }
          ]"
        />
        
        <van-field
          v-model="form.nickname"
          label="昵称"
          placeholder="请输入昵称（2-20个字符）"
          :rules="[
            { required: true, message: '请输入昵称' },
            { pattern: /^.{2,20}$/, message: '昵称长度应在2-20个字符之间' }
          ]"
          maxlength="20"
        />
        
        <div class="agreement">
          <van-checkbox v-model="agreeTerms" icon-size="16px">
            我已阅读并同意
            <span class="link" @click.stop>《用户协议》</span>
            和
            <span class="link" @click.stop>《隐私政策》</span>
          </van-checkbox>
        </div>
        
        <div class="form-actions">
          <van-button 
            type="primary" 
            native-type="submit" 
            block 
            :loading="loading"
            :disabled="!agreeTerms"
            class="register-btn"
          >
            注册
          </van-button>
        </div>
      </van-form>
    </div>
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
  password: '',
  confirmPassword: '',
  nickname: ''
})

const loading = ref(false)
const agreeTerms = ref(false)

// 验证密码一致性
const validatePassword = (value) => {
  if (value !== form.value.password) {
    return '两次输入的密码不一致'
  }
  return true
}

// 处理注册
const handleRegister = async () => {
  if (!agreeTerms.value) {
    showToast('请先同意用户协议')
    return
  }
  
  loading.value = true
  
  try {
    const registerData = {
      phone: form.value.phone,
      password: form.value.password,
      nickname: form.value.nickname
    }
    
    const result = await userStore.register(registerData)
    
    if (result.success) {
      showToast('注册成功')
      // 注册成功后跳转到首页
      setTimeout(() => {
        router.push('/home')
      }, 1000)
    } else {
      showToast(result.message || '注册失败')
    }
  } catch (error) {
    console.error('注册错误:', error)
    const errorMessage = error.response?.data?.message || '注册失败，请重试'
    showToast(errorMessage)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.nav-bar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.content {
  padding: 20px;
}

.register-form {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.agreement {
  margin: 20px 0;
  font-size: 14px;
  color: #666;
}

.agreement .link {
  color: #667eea;
  text-decoration: none;
}

.form-actions {
  margin-top: 30px;
}

.register-btn {
  height: 50px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 500;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}
</style>