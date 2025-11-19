import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/utils/request'

export const useUserStore = defineStore('user', () => {
  // 从localStorage初始化用户信息
  const initUser = () => {
    try {
      const savedUser = localStorage.getItem('userInfo')
      return savedUser ? JSON.parse(savedUser) : null
    } catch (error) {
      console.error('解析用户信息失败:', error)
      return null
    }
  }

  const user = ref(initUser())
  const token = ref(localStorage.getItem('token') || '')

  // 设置用户信息
  const setUser = (userData) => {
    user.value = userData
    if (userData) {
      localStorage.setItem('userInfo', JSON.stringify(userData))
    } else {
      localStorage.removeItem('userInfo')
    }
  }

  // 设置token
  const setToken = (newToken) => {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
    } else {
      localStorage.removeItem('token')
    }
  }

  // 登录
  const login = async (loginData) => {
    try {
      const response = await request.post('/auth/login', loginData)
      const { user: userData, token: userToken } = response.data.data
      
      setUser(userData)
      setToken(userToken)
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || '登录失败' 
      }
    }
  }

  // 注册
  const register = async (registerData) => {
    try {
      const response = await request.post('/auth/register', registerData)
      const { user: userData, token: userToken } = response.data.data
      
      setUser(userData)
      setToken(userToken)
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || '注册失败' 
      }
    }
  }

  // 退出登录
  const logout = () => {
    user.value = null
    token.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  // 获取用户信息
  const fetchUserProfile = async () => {
    try {
      const response = await request.get('/users/me/info')
      setUser(response.data.data)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || '获取用户信息失败' 
      }
    }
  }

  // 更新用户信息
  const updateProfile = async (profileData) => {
    try {
      const response = await request.put('/users/profile', profileData)
      setUser(response.data.data)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || '更新用户信息失败' 
      }
    }
  }

  // 计算属性
  const isLoggedIn = () => {
    return !!token.value && !!user.value
  }

  const userInfo = user.value

  return {
    user,
    token,
    userInfo,
    setUser,
    setToken,
    login,
    register,
    logout,
    fetchUserProfile,
    updateProfile,
    isLoggedIn
  }
})