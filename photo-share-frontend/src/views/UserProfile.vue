<template>
  <div class="user-profile-container">
    <van-nav-bar
      :title="isCurrentUser ? '我的主页' : '用户主页'"
      left-arrow
      @click-left="goBack"
      class="nav-bar"
    />

    <!-- 用户信息头部 -->
    <div class="profile-header">
      <!-- 封面图 -->
      <div class="cover-image">
        <van-image
          :src="user.coverImage || 'https://picsum.photos/seed/cover/800/300.jpg'"
          fit="cover"
          class="cover-img"
        />
        <div v-if="isCurrentUser" class="edit-cover-btn" @click="editCover">
          <van-icon name="camera-o" />
        </div>
      </div>

      <!-- 用户基本信息 -->
      <div class="user-info">
        <div class="avatar-section">
          <van-image
            :src="user.avatar"
            round
            width="80"
            height="80"
            class="user-avatar"
          />
          <div v-if="isCurrentUser" class="edit-avatar-btn" @click="editAvatar">
            <van-icon name="camera-o" />
          </div>
        </div>

        <div class="user-details">
          <div class="user-nickname">{{ user.nickname }}</div>
          <div class="user-bio">{{ user.bio || '这个人很懒，什么都没写' }}</div>
          
          <!-- 统计数据 -->
          <div class="user-stats">
            <div class="stat-item" @click="showFollowers">
              <div class="stat-number">{{ user.followers }}</div>
              <div class="stat-label">粉丝</div>
            </div>
            <div class="stat-item" @click="showFollowing">
              <div class="stat-number">{{ user.following }}</div>
              <div class="stat-label">关注</div>
            </div>
            <div class="stat-item" @click="showLikes">
              <div class="stat-number">{{ user.likes }}</div>
              <div class="stat-label">获赞</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <van-button
          v-if="isCurrentUser"
          type="primary"
          block
          @click="editProfile"
          class="edit-profile-btn"
        >
          编辑资料
        </van-button>
        <div v-else class="user-actions">
          <van-button
            v-if="!user.isFollowing"
            type="primary"
            @click="handleFollow"
            class="follow-btn"
          >
            关注
          </van-button>
          <van-button
            v-else
            type="default"
            @click="handleUnfollow"
            class="follow-btn"
          >
            已关注
          </van-button>
          <van-button
            type="default"
            @click="sendMessage"
            class="message-btn"
          >
            私信
          </van-button>
        </div>
      </div>
    </div>

    <!-- 作品标签页 -->
    <div class="content-tabs">
      <van-tabs v-model:active="activeTab" sticky>
        <van-tab title="作品" name="works">
          <div class="works-grid">
            <div
              v-for="work in userWorks"
              :key="work.id"
              class="work-item"
              @click="goToPhotoDetail(work.id)"
            >
              <van-image
                :src="work.image"
                fit="cover"
                class="work-image"
              />
              <div class="work-info">
                <div class="work-title">{{ work.title }}</div>
                <div class="work-stats">
                  <span><van-icon name="like-o" /> {{ work.likes }}</span>
                  <span><van-icon name="chat-o" /> {{ work.comments }}</span>
                </div>
              </div>
            </div>
          </div>
        </van-tab>
        
        <van-tab title="收藏" name="collections">
          <div class="collections-grid">
            <div
              v-for="collection in userCollections"
              :key="collection.id"
              class="collection-item"
              @click="goToPhotoDetail(collection.id)"
            >
              <van-image
                :src="collection.image"
                fit="cover"
                class="collection-image"
              />
              <div class="collection-info">
                <div class="collection-title">{{ collection.title }}</div>
                <div class="collection-author">{{ collection.user.nickname }}</div>
              </div>
            </div>
          </div>
        </van-tab>
        
        <van-tab title="喜欢" name="likes">
          <div class="likes-grid">
            <div
              v-for="like in userLikes"
              :key="like.id"
              class="like-item"
              @click="goToPhotoDetail(like.id)"
            >
              <van-image
                :src="like.image"
                fit="cover"
                class="like-image"
              />
              <div class="like-info">
                <div class="like-title">{{ like.title }}</div>
                <div class="like-author">{{ like.user.nickname }}</div>
              </div>
            </div>
          </div>
        </van-tab>
      </van-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'
import { showToast, showConfirmDialog } from 'vant'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const userId = parseInt(route.params.id)
const activeTab = ref('works')
const loading = ref(false)

// 判断是否是当前用户
const isCurrentUser = computed(() => {
  return userStore.userInfo && userStore.userInfo.id === userId
})

// 用户信息
const user = ref({
  id: userId,
  nickname: '',
  avatar: '',
  coverImage: '',
  bio: '',
  followers: 0,
  following: 0,
  likes: 0,
  isFollowing: false,
  stats: {
    photos: 0,
    followers: 0,
    following: 0
  }
})

// 用户作品
const userWorks = ref([])

// 用户收藏
const userCollections = ref([])

// 用户喜欢
const userLikes = ref([])

// 加载用户信息
const loadUserProfile = async () => {
  try {
    loading.value = true
    console.log('开始加载用户信息，userId:', userId)
    const timestamp = Date.now()
    const response = await request.get(`/users/${userId}?t=${timestamp}`)
    console.log('用户信息响应:', response.data)
    
    if (response.data.success) {
      const userData = response.data.data
      user.value = {
        ...userData,
        followers: userData.stats.followers,
        following: userData.stats.following,
        likes: userData.stats.photos * 10 // 模拟获赞数
      }
      console.log('用户信息加载成功:', user.value)
    } else {
      console.error('用户信息加载失败，响应:', response.data)
      showToast('加载用户信息失败')
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
    console.error('错误详情:', error.response?.data)
    showToast('加载用户信息失败')
  } finally {
    loading.value = false
  }
}

// 加载用户作品
const loadUserWorks = async () => {
  try {
    console.log('开始加载用户作品，userId:', userId)
    const timestamp = Date.now()
    const response = await request.get(`/photos/user/${userId}?t=${timestamp}`)
    console.log('用户作品响应:', response.data)
    
    if (response.data.success) {
      userWorks.value = response.data.data.photos.map(photo => ({
        id: photo.id,
        title: photo.title,
        image: photo.imageUrl,
        likes: photo.likes || 0,
        comments: photo.comments || 0
      }))
      console.log('用户作品加载成功:', userWorks.value)
    } else {
      console.error('用户作品加载失败，响应:', response.data)
      showToast('加载用户作品失败')
    }
  } catch (error) {
    console.error('加载用户作品失败:', error)
    console.error('错误详情:', error.response?.data)
    showToast('加载用户作品失败')
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 编辑封面
const editCover = () => {
  showToast('封面编辑功能开发中')
}

// 编辑头像
const editAvatar = () => {
  showToast('头像编辑功能开发中')
}

// 编辑资料
const editProfile = () => {
  router.push('/profile/edit')
}

// 关注用户
const handleFollow = async () => {
  try {
    const response = await request.post(`/api/follows/${userId}`)
    
    if (response.data.success) {
      user.value.isFollowing = true
      user.value.followers++
      showToast('关注成功')
    }
  } catch (error) {
    console.error('关注失败:', error)
    showToast('关注失败')
  }
}

// 取消关注
const handleUnfollow = async () => {
  try {
    await showConfirmDialog({
      title: '确认取消关注',
      message: '确定要取消关注该用户吗？'
    })
    
    const response = await request.delete(`/api/follows/${userId}`)
    
    if (response.data.success) {
      user.value.isFollowing = false
      user.value.followers--
      showToast('已取消关注')
    }
  } catch (error) {
    if (error.action !== 'cancel') {
      console.error('取消关注失败:', error)
      showToast('取消关注失败')
    }
  }
}

// 发送私信
const sendMessage = () => {
  showToast('私信功能开发中')
}

// 显示粉丝列表
const showFollowers = () => {
  router.push(`/user/${userId}/followers`)
}

// 显示关注列表
const showFollowing = () => {
  router.push(`/user/${userId}/following`)
}

// 显示获赞列表
const showLikes = () => {
  router.push(`/user/${userId}/likes`)
}

// 跳转到图片详情
const goToPhotoDetail = (photoId) => {
  router.push(`/photo/${photoId}`)
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return Math.floor(diff / 60000) + '分钟前'
  } else if (diff < 86400000) {
    return Math.floor(diff / 3600000) + '小时前'
  } else if (diff < 2592000000) {
    return Math.floor(diff / 86400000) + '天前'
  } else {
    return date.toLocaleDateString()
  }
}

onMounted(() => {
  loadUserProfile()
  loadUserWorks()
})
</script>

<style scoped>
.user-profile-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.nav-bar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.profile-header {
  background: white;
  margin-bottom: 8px;
}

.cover-image {
  position: relative;
  height: 200px;
}

.cover-img {
  width: 100%;
  height: 100%;
}

.edit-cover-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.user-info {
  padding: 0 16px 16px;
  margin-top: -40px;
  position: relative;
}

.avatar-section {
  position: relative;
  display: inline-block;
}

.user-avatar {
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.edit-avatar-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  background: #667eea;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 2px solid white;
}

.user-details {
  margin-top: 12px;
}

.user-nickname {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.user-bio {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  margin-bottom: 16px;
}

.user-stats {
  display: flex;
  gap: 32px;
}

.stat-item {
  text-align: center;
  cursor: pointer;
}

.stat-number {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.action-buttons {
  padding: 0 16px 16px;
}

.edit-profile-btn {
  height: 44px;
}

.user-actions {
  display: flex;
  gap: 12px;
}

.follow-btn,
.message-btn {
  flex: 1;
  height: 44px;
}

.content-tabs {
  background: white;
}

.works-grid,
.collections-grid,
.likes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 8px;
}

.work-item,
.collection-item,
.like-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.work-image,
.collection-image,
.like-image {
  width: 100%;
  height: 200px;
}

.work-info,
.collection-info,
.like-info {
  padding: 8px;
}

.work-title,
.collection-title,
.like-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.work-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.collection-author,
.like-author {
  font-size: 12px;
  color: #999;
}
</style>