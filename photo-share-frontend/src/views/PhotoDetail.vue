<template>
  <div class="photo-detail-container">
    <van-nav-bar
      title="作品详情"
      left-arrow
      @click-left="goBack"
      class="nav-bar"
    />

    <!-- 图片展示 -->
    <div class="photo-section">
      <van-image
        :src="photo.imageUrl"
        fit="contain"
        class="photo-image"
      />
    </div>

    <!-- 作品信息 -->
    <div class="photo-info">
      <div class="author-info" @click="goToUserPage">
        <van-image
          :src="photo.user.avatar"
          round
          width="40"
          height="40"
          class="author-avatar"
        />
        <div class="author-details">
          <div class="author-name">{{ photo.user.nickname }}</div>
          <div class="post-time">{{ formatTime(photo.createdAt) }}</div>
        </div>
        <van-button
          v-if="!isCurrentUser && !photo.user.isFollowing"
          type="primary"
          size="small"
          @click.stop="handleFollow"
          class="follow-btn"
        >
          关注
        </van-button>
        <van-button
          v-if="!isCurrentUser && photo.user.isFollowing"
          type="default"
          size="small"
          @click.stop="handleUnfollow"
          class="follow-btn"
        >
          已关注
        </van-button>
      </div>

      <div class="photo-title">{{ photo.title }}</div>
      <div class="photo-description">{{ photo.description }}</div>
      
      <div class="photo-meta">
        <div v-if="photo.category" class="meta-item">
          <van-tag type="primary" size="small">{{ photo.category }}</van-tag>
        </div>
        <div v-if="photo.location" class="meta-item">
          <van-icon name="location-o" />
          <span>{{ photo.location }}</span>
        </div>
        <div v-if="photo.camera" class="meta-item">
          <van-icon name="camera-o" />
          <span>{{ photo.camera }}</span>
        </div>
        <div v-if="photo.lens" class="meta-item">
          <van-icon name="photograph" />
          <span>{{ photo.lens }}</span>
        </div>
      </div>
      
      <div v-if="photo.tags && photo.tags.length > 0" class="photo-tags">
        <van-tag
          v-for="tag in photo.tags"
          :key="tag"
          type="primary"
          size="small"
          class="tag"
        >
          #{{ tag }}
        </van-tag>
      </div>
    </div>

    <!-- 互动区域 -->
    <div class="interaction-section">
      <div class="action-buttons">
        <div class="action-item" @click="handleLike">
          <van-icon
            :name="photo.isLiked ? 'like' : 'like-o'"
            :color="photo.isLiked ? '#ee0a24' : '#666'"
            size="20"
          />
          <span>{{ photo.likes }}</span>
        </div>
        <div class="action-item" @click="handleComment">
          <van-icon name="chat-o" color="#666" size="20" />
          <span>{{ photo.comments }}</span>
        </div>
        <div class="action-item" @click="handleShare">
          <van-icon name="share-o" color="#666" size="20" />
          <span>分享</span>
        </div>
        <div class="action-item" @click="handleCollect">
          <van-icon
            :name="photo.isCollected ? 'star' : 'star-o'"
            :color="photo.isCollected ? '#ff976a' : '#666'"
            size="20"
          />
          <span>收藏</span>
        </div>
      </div>
    </div>

    <!-- 评论区 -->
    <div class="comments-section">
      <div class="section-title">评论 ({{ photo.comments }})</div>
      
      <div class="comment-input">
        <van-field
          v-model="commentText"
          placeholder="写下你的评论..."
          :border="false"
          @keyup.enter="submitComment"
        >
          <template #button>
            <van-button
              type="primary"
              size="small"
              @click="submitComment"
              :disabled="!commentText.trim()"
            >
              发送
            </van-button>
          </template>
        </van-field>
      </div>

      <div class="comments-list">
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="comment-item"
        >
          <van-image
            :src="comment.user.avatar"
            round
            width="32"
            height="32"
            class="comment-avatar"
          />
          <div class="comment-content">
            <div class="comment-user">{{ comment.user.nickname }}</div>
            <div class="comment-text">{{ comment.content }}</div>
            <div class="comment-time">{{ formatTime(comment.createdAt) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { showToast, showLoadingToast, closeToast } from 'vant'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const photoId = route.params.id
const commentText = ref('')
const loading = ref(false)

// 图片数据
const photo = ref({
  id: null,
  title: '',
  description: '',
  imageUrl: '',
  thumbnailUrl: '',
  user: {
    id: null,
    nickname: '',
    avatar: '',
    isVerified: false,
    isFollowing: false
  },
  likes: 0,
  comments: 0,
  isLiked: false,
  isCollected: false,
  tags: [],
  createdAt: ''
})

// 评论列表
const comments = ref([])

// 判断是否是当前用户
const isCurrentUser = computed(() => {
  return userStore.userInfo && userStore.userInfo.id === photo.value.user.id
})

// 返回上一页
const goBack = () => {
  router.back()
}

// 跳转到用户页面
const goToUserPage = () => {
  if (!isCurrentUser.value) {
    router.push(`/user/${photo.value.user.id}`)
  }
}

// 点赞/取消点赞
const handleLike = async () => {
  if (!userStore.isLoggedIn) {
    showToast('请先登录')
    return
  }

  try {
    const action = photo.value.isLiked ? 'unlike' : 'like'
    const response = await request({
      url: `/likes/photo/${photoId}`,
      method: 'POST',
      data: { action }
    })

    if (response.data.success) {
      photo.value.isLiked = response.data.data.isLiked
      photo.value.likes = response.data.data.likes
      showToast(response.data.message)
    }
  } catch (error) {
    console.error('点赞操作失败:', error)
    showToast('操作失败，请稍后重试')
  }
}

// 评论
const handleComment = () => {
  // 滚动到评论区
  document.querySelector('.comments-section').scrollIntoView({ behavior: 'smooth' })
}

// 分享
const handleShare = () => {
  if (navigator.share) {
    navigator.share({
      title: photo.value.title,
      text: photo.value.description,
      url: window.location.href
    })
  } else {
    // 复制链接到剪贴板
    navigator.clipboard.writeText(window.location.href)
    showToast('链接已复制')
  }
}

// 收藏
const handleCollect = () => {
  showToast('收藏功能开发中')
}

// 关注
const handleFollow = async () => {
  if (!userStore.isLoggedIn) {
    showToast('请先登录')
    return
  }

  try {
    const response = await request({
      url: `/follows/${photo.value.user.id}`,
      method: 'POST'
    })

    if (response.success) {
      photo.value.user.isFollowing = true
      showToast('关注成功')
    }
  } catch (error) {
    console.error('关注失败:', error)
    showToast('关注失败，请稍后重试')
  }
}

// 取消关注
const handleUnfollow = async () => {
  if (!userStore.isLoggedIn) {
    showToast('请先登录')
    return
  }

  try {
    const response = await request({
      url: `/follows/${photo.value.user.id}`,
      method: 'DELETE'
    })

    if (response.success) {
      photo.value.user.isFollowing = false
      showToast('取消关注成功')
    }
  } catch (error) {
    console.error('取消关注失败:', error)
    showToast('取消关注失败，请稍后重试')
  }
}

// 提交评论
const submitComment = async () => {
  if (!userStore.isLoggedIn) {
    showToast('请先登录')
    return
  }

  if (!commentText.value.trim()) {
    showToast('请输入评论内容')
    return
  }

  try {
    const response = await request({
      url: '/comments',
      method: 'POST',
      data: {
        photoId: photoId,
        content: commentText.value.trim()
      }
    })

    if (response.data.success) {
      comments.value.unshift(response.data.data)
      photo.value.comments++
      commentText.value = ''
      showToast('评论发表成功')
    }
  } catch (error) {
    console.error('发表评论失败:', error)
    showToast('发表评论失败，请稍后重试')
  }
}

// 格式化时间
const formatTime = (timeString) => {
  const date = new Date(timeString)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  } else if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`
  } else {
    return date.toLocaleDateString()
  }
}

// 加载图片详情
const loadPhotoDetail = async () => {
  try {
    loading.value = true
    
    // 检查photoId是否有效
    if (!photoId || isNaN(parseInt(photoId))) {
      console.error('无效的图片ID:', photoId)
      showToast('无效的图片ID')
      router.push('/') // 重定向到首页
      return
    }
    
    const response = await request({
      url: `/photos/${photoId}`,
      method: 'GET'
    })

    if (response.data.success) {
      const photoData = response.data.data
      
      // 处理图片数据，确保包含所有必要信息
      photo.value = {
        id: photoData.id,
        title: photoData.title || '未命名作品',
        description: photoData.description || '',
        imageUrl: photoData.imageUrl || '',
        thumbnailUrl: photoData.thumbnailUrl || photoData.imageUrl,
        width: photoData.width,
        height: photoData.height,
        fileSize: photoData.fileSize,
        format: photoData.format,
        tags: photoData.tags || [],
        category: photoData.category,
        location: photoData.location,
        camera: photoData.camera,
        lens: photoData.lens,
        settings: photoData.settings || {},
        likes: photoData.likes || 0,
        comments: photoData.comments || 0,
        views: photoData.views || 0,
        isLiked: photoData.isLiked || false,
        publishedAt: photoData.publishedAt,
        createdAt: photoData.createdAt,
        user: {
          id: photoData.user?.id,
          nickname: photoData.user?.nickname || '未知用户',
          avatar: photoData.user?.avatar || '',
          bio: photoData.user?.bio || '',
          isVerified: photoData.user?.isVerified || false,
          isFollowing: photoData.user?.isFollowing || false
        }
      }
      
      // 如果有评论数据，直接使用
      if (photoData.photoComments && photoData.photoComments.length > 0) {
        comments.value = photoData.photoComments.map(comment => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          user: {
            id: comment.user?.id,
            nickname: comment.user?.nickname || '未知用户',
            avatar: comment.user?.avatar || '',
            isVerified: comment.user?.isVerified || false
          },
          replies: comment.replies || []
        }))
      }
    } else {
      console.error('获取作品详情失败，响应:', response.data)
      showToast('获取作品详情失败')
    }
  } catch (error) {
    console.error('加载图片详情失败:', error)
    showToast('加载失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 加载评论列表
const loadComments = async () => {
  try {
    // 检查photoId是否有效
    if (!photoId || isNaN(parseInt(photoId))) {
      console.error('无效的图片ID:', photoId)
      return
    }
    
    const response = await request({
      url: `/comments/photo/${photoId}`,
      method: 'GET'
    })

    if (response.data.success) {
      comments.value = response.data.data.comments || []
    } else {
      console.error('获取评论列表失败，响应:', response.data)
      showToast('获取评论列表失败')
    }
  } catch (error) {
    console.error('加载评论失败:', error)
    showToast('获取评论列表失败')
  }
}

onMounted(async () => {
  // 检查photoId是否有效
  if (!photoId || isNaN(parseInt(photoId))) {
    console.error('无效的图片ID:', photoId)
    showToast('无效的图片ID')
    router.push('/') // 重定向到首页
    return
  }
  
  await loadPhotoDetail()
  await loadComments()
})
</script>

<style scoped>
.photo-detail-container {
  min-height: 100vh;
  background-color: #fff;
  padding-bottom: 20px;
}

.nav-bar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.photo-section {
  padding: 16px;
  background: #000;
}

.photo-image {
  width: 100%;
  max-height: 500px;
}

.photo-info {
  padding: 16px;
}

.author-info {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  cursor: pointer;
}

.author-avatar {
  margin-right: 12px;
}

.author-details {
  flex: 1;
}

.author-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.post-time {
  font-size: 12px;
  color: #999;
}

.follow-btn {
  margin-left: 12px;
}

.photo-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.photo-description {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 12px;
}

.photo-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
  align-items: center;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.meta-item .van-icon {
  font-size: 14px;
}

.photo-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  margin-right: 4px;
}

.interaction-section {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
}

.action-buttons {
  display: flex;
  justify-content: space-around;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.action-item:hover {
  background-color: #f9f9f9;
}

.action-item span {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.comments-section {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 16px;
}

.comment-input {
  margin-bottom: 20px;
}

.comments-list {
  max-height: 400px;
  overflow-y: auto;
}

.comment-item {
  display: flex;
  margin-bottom: 16px;
}

.comment-avatar {
  margin-right: 12px;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-user {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.comment-text {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  margin-bottom: 4px;
}

.comment-time {
  font-size: 12px;
  color: #999;
}
</style>