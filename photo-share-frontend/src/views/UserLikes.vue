<template>
  <div class="user-likes-container">
    <van-nav-bar
      :title="pageTitle"
      left-arrow
      @click-left="goBack"
      class="nav-bar"
    />

    <!-- 统计信息 -->
    <div class="stats-section">
      <div class="stats-card">
        <div class="stat-item">
          <div class="stat-number">{{ totalLikes }}</div>
          <div class="stat-label">总获赞数</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ totalPhotos }}</div>
          <div class="stat-label">作品数</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ avgLikes }}</div>
          <div class="stat-label">平均获赞</div>
        </div>
      </div>
    </div>

    <!-- 获赞作品列表 -->
    <div class="likes-list">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadLikedPhotos"
      >
        <div
          v-for="photo in likedPhotos"
          :key="photo.id"
          class="photo-item"
          @click="goToPhotoDetail(photo.id)"
        >
          <van-image
            :src="photo.imageUrl"
            fit="cover"
            class="photo-image"
          />
          <div class="photo-info">
            <div class="photo-title">{{ photo.title }}</div>
            <div class="photo-description">{{ photo.description }}</div>
            <div class="photo-tags">
              <van-tag
                v-for="tag in photo.tags"
                :key="tag"
                type="primary"
                size="small"
                class="photo-tag"
              >
                {{ tag }}
              </van-tag>
            </div>
            <div class="photo-stats">
              <div class="stat">
                <van-icon name="like-o" color="#ff6b6b" />
                <span>{{ photo.likes }} 获赞</span>
              </div>
              <div class="stat">
                <van-icon name="chat-o" color="#4ecdc4" />
                <span>{{ photo.comments }} 评论</span>
              </div>
              <div class="stat">
                <van-icon name="eye-o" color="#95a5a6" />
                <span>{{ photo.views || 0 }} 浏览</span>
              </div>
            </div>
            <div class="photo-time">
              发布于 {{ formatTime(photo.createdAt) }}
            </div>
          </div>
        </div>
      </van-list>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '@/utils/request'
import { showToast } from 'vant'

const route = useRoute()
const router = useRouter()

const userId = parseInt(route.params.id)
const loading = ref(false)
const finished = ref(false)
const likedPhotos = ref([])
const currentPage = ref(1)
const pageSize = 20
const totalLikes = ref(0)
const totalPhotos = ref(0)

const pageTitle = computed(() => {
  return '获赞详情'
})

const avgLikes = computed(() => {
  return totalPhotos.value > 0 ? Math.round(totalLikes.value / totalPhotos.value) : 0
})

// 加载获赞作品
const loadLikedPhotos = async () => {
  try {
    loading.value = true
    const response = await request.get(`/photos/user/${userId}/liked`, {
      params: {
        page: currentPage.value,
        pageSize: pageSize
      }
    })

    if (response.data.success) {
      const { data } = response.data
      const newPhotos = data.photos || []
      
      likedPhotos.value.push(...newPhotos)
      
      if (newPhotos.length < pageSize) {
        finished.value = true
      } else {
        currentPage.value++
      }

      // 更新统计信息
      if (data.stats) {
        totalLikes.value = data.stats.totalLikes
        totalPhotos.value = data.stats.totalPhotos
      }
    } else {
      showToast('加载失败')
    }
  } catch (error) {
    console.error('加载获赞作品失败:', error)
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.back()
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
  loadLikedPhotos()
})
</script>

<style scoped>
.user-likes-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.nav-bar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stats-section {
  padding: 16px;
  background: white;
  margin-bottom: 8px;
}

.stats-card {
  display: flex;
  justify-content: space-around;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
}

.likes-list {
  background: white;
}

.photo-item {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.photo-item:hover {
  background-color: #fafafa;
}

.photo-item:last-child {
  border-bottom: none;
}

.photo-image {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  margin-bottom: 12px;
  object-fit: cover;
}

.photo-info {
  padding: 0 4px;
}

.photo-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.4;
}

.photo-description {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.photo-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.photo-tag {
  background: #e8f4fd;
  color: #1976d2;
  border: none;
}

.photo-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 8px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #666;
}

.photo-time {
  font-size: 12px;
  color: #999;
}
</style>