import axios from 'axios'
import { useUserStore } from '@/stores/user'
import { showToast } from 'vant'

// 创建axios实例
const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const userStore = useUserStore()
    
    // 网络错误处理
    if (!error.response) {
      if (error.message.includes('Network Error') || error.message.includes('ERR_NETWORK')) {
        showToast('网络连接失败，请检查网络后重试')
      } else if (error.message.includes('timeout')) {
        showToast('请求超时，请稍后重试')
      } else {
        showToast('网络异常，请重试')
      }
      return Promise.reject(error)
    }
    
    // 服务器响应错误处理
    const status = error.response.status
    const message = error.response.data?.message
    
    switch (status) {
      case 400:
        showToast(message || '请求参数错误')
        break
      case 401:
        // token过期，清除用户信息并跳转到登录页
        userStore.logout()
        showToast('登录已过期，请重新登录')
        window.location.href = '/login'
        break
      case 403:
        showToast('没有权限访问')
        break
      case 404:
        showToast(message || '请求的资源不存在')
        break
      case 429:
        showToast('请求过于频繁，请稍后再试')
        break
      case 500:
        showToast('服务器内部错误，请稍后重试')
        break
      case 502:
        showToast('服务器网关错误，请稍后重试')
        break
      case 503:
        showToast('服务暂时不可用，请稍后重试')
        break
      default:
        showToast(message || `请求失败 (${status})`)
    }
    
    return Promise.reject(error)
  }
)

export default request