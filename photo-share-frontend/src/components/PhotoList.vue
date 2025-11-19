<template>
  <div class="photo-list">
    <div class="photo-grid" :style="{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }">
      <div
        v-for="photo in photos"
        :key="photo.id"
        class="photo-item"
        @click="goToPhotoDetail(photo.id)"
      >
        <div class="photo-wrapper">
          <img
            :src="photo.thumbnailUrl"
            :alt="photo.title"
            class="photo-image"
            @load="onImageLoad"
          />
          <div class="photo-overlay">
            <div class="photo-info">
              <div class="photo-title">{{ photo.title }}</div>
              <div class="photo-stats">
                <span class="stat-item">
                  <van-icon name="like-o" />
                  {{ formatCount(photo.likesCount) }}
                </span>
                <span class="stat-item">
                  <van-icon name="comment-o" />
                  {{ formatCount(photo.commentsCount) }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="user-info">
          <van-image
            :src="photo.user.avatar"
            round
            width="24"
            height="24"
            class="user-avatar"
          />
          <span class="user-nickname">{{ photo.user.nickname }}</span>
        </div>
      </div>
    </div>
    
    <div v-if="!finished" class="load-more" @click="loadMore">
      <van-loading v-if="loading" />
      <span v-else>加载更多</span>
    </div>
    <div v-else class="finished-text">
      没有更多了
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  photos: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['load-more'])

const router = useRouter()
const columnCount = ref(2)
const loading = ref(false)
const finished = ref(false)

// 根据屏幕宽度计算列数
const calculateColumns = () => {
  const width = window.innerWidth
  if (width < 375) {
    columnCount.value = 2
  } else if (width < 768) {
    columnCount.value = 3
  } else {
    columnCount.value = 4
  }
}

// 格式化数字
const formatCount = (count) => {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + 'w'
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k'
  }
  return count.toString()
}

// 图片加载完成
const onImageLoad = (event) => {
  // 可以在这里添加图片加载完成的逻辑
}

// 跳转到图片详情页
const goToPhotoDetail = (photoId) => {
  router.push(`/photo/${photoId}`)
}

// 加载更多
const loadMore = () => {
  if (!loading.value && !finished.value) {
    loading.value = true
    emit('load-more')
    // 模拟加载完成
    setTimeout(() => {
      loading.value = false
    }, 1000)
  }
}

onMounted(() => {
  calculateColumns()
  window.addEventListener('resize', calculateColumns)
})

onUnmounted(() => {
  window.removeEventListener('resize', calculateColumns)
})
</script>

<style scoped>
.photo-list {
  padding: 8px;
}

.photo-grid {
  display: grid;
  gap: 8px;
}

.photo-item {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.photo-item:hover {
  transform: translateY(-2px);
}

.photo-wrapper {
  position: relative;
  overflow: hidden;
}

.photo-image {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.3s ease;
}

.photo-item:hover .photo-image {
  transform: scale(1.05);
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 20px 12px 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.photo-item:hover .photo-overlay {
  opacity: 1;
}

.photo-info {
  color: white;
}

.photo-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.photo-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.user-info {
  display: flex;
  align-items: center;
  padding: 12px;
  gap: 8px;
}

.user-avatar {
  flex-shrink: 0;
}

.user-nickname {
  font-size: 14px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.load-more {
  text-align: center;
  padding: 16px;
  color: #666;
  cursor: pointer;
  border-radius: 8px;
  margin-top: 8px;
  background: #f5f5f5;
  transition: background-color 0.2s ease;
}

.load-more:hover {
  background: #e8e8e8;
}

.finished-text {
  text-align: center;
  padding: 16px;
  color: #999;
  font-size: 14px;
}
</style>