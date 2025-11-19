<template>
  <div class="photo-list">
    <div class="photo-grid" :style="{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }">
      <div
        v-for="photo in displayPhotos"
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
                  {{ formatCount(photo.likes || 0) }}
                </span>
                <span class="stat-item">
                  <van-icon name="comment-o" />
                  {{ formatCount(photo.comments || 0) }}
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
    
    <!-- 轮播控制 -->
    <div v-if="photos.length > displayCount" class="carousel-controls">
      <button @click="prevPage" class="control-btn">
        <van-icon name="arrow-left" />
      </button>
      <div class="page-indicator">
        <span>{{ currentPage }} / {{ totalPages }}</span>
      </div>
      <button @click="nextPage" class="control-btn">
        <van-icon name="arrow-right" />
      </button>
    </div>
    
    <div v-else-if="!finished" class="load-more" @click="loadMore">
      <van-loading v-if="loading" />
      <span v-else>加载更多</span>
    </div>
    <div v-else class="finished-text">
      没有更多了
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
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

// 轮播相关配置
const displayCount = ref(12) // 每次显示的图片数量
const currentPage = ref(1) // 当前页码
let carouselTimer = null

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(props.photos.length / displayCount.value)
})

// 计算当前显示的图片
const displayPhotos = computed(() => {
  const startIndex = (currentPage.value - 1) * displayCount.value
  const endIndex = startIndex + displayCount.value
  return props.photos.slice(startIndex, endIndex)
})

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

// 上一页
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  } else {
    currentPage.value = totalPages.value // 循环到最后一页
  }
}

// 下一页
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  } else {
    currentPage.value = 1 // 循环到第一页
  }
}

// 自动轮播
const startCarousel = () => {
  if (carouselTimer) clearInterval(carouselTimer)
  carouselTimer = setInterval(() => {
    nextPage()
  }, 1000) // 轮播间隔1秒
}

// 停止轮播
const stopCarousel = () => {
  if (carouselTimer) {
    clearInterval(carouselTimer)
    carouselTimer = null
  }
}

// 加载更多
const loadMore = () => {
  if (!loading.value && !finished.value) {
    loading.value = true
    emit('load-more')
    // 这里等待父组件加载完成，父组件会调用真实API获取数据
    // 使用setTimeout确保加载状态有足够时间显示
    setTimeout(() => {
      loading.value = false
    }, 1000)
  }
}

onMounted(() => {
  calculateColumns()
  window.addEventListener('resize', calculateColumns)
  startCarousel()
})

onUnmounted(() => {
  window.removeEventListener('resize', calculateColumns)
  stopCarousel()
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
    padding: 20px 0;
    color: #969799;
  }

  /* 轮播控制样式 */
  .carousel-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 20px 0;
    gap: 20px;
  }

  .control-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid #dcdfe6;
    background-color: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .control-btn:hover {
    background-color: #f5f7fa;
    border-color: #c6e2ff;
    color: #409eff;
  }

  .page-indicator {
    color: #606266;
    font-size: 14px;
  }
</style>