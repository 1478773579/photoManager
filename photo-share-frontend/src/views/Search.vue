<template>
  <div class="search-container">
    <van-nav-bar
      title="搜索"
      left-arrow
      @click-left="goBack"
      class="nav-bar"
    />

    <!-- 搜索框 -->
    <div class="search-bar">
      <van-search
        v-model="searchQuery"
        placeholder="搜索作品、用户或标签"
        @search="handleSearch"
        @clear="handleClear"
        show-action
        action-text="搜索"
        @click-action="handleSearch"
        class="search-input"
      />
    </div>

    <!-- 搜索历史 -->
    <div v-if="!hasSearched && searchHistory.length > 0" class="search-history">
      <div class="history-header">
        <span>搜索历史</span>
        <van-icon name="delete-o" @click="clearHistory" class="clear-btn" />
      </div>
      <div class="history-tags">
        <van-tag
          v-for="item in searchHistory"
          :key="item"
          type="default"
          size="medium"
          @click="searchHistoryItem(item)"
          class="history-tag"
        >
          {{ item }}
        </van-tag>
      </div>
    </div>

    <!-- 热门搜索 -->
    <div v-if="!hasSearched" class="hot-search">
      <div class="hot-header">热门搜索</div>
      <div class="hot-tags">
        <van-tag
          v-for="tag in hotTags"
          :key="tag"
          type="primary"
          size="medium"
          @click="searchHotTag(tag)"
          class="hot-tag"
        >
          {{ tag }}
        </van-tag>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div v-if="hasSearched" class="search-results">
      <!-- 搜索类型切换 -->
      <van-tabs v-model:active="activeTab" class="result-tabs">
        <van-tab title="作品" name="photos">
          <div class="photos-grid">
            <div
              v-for="photo in searchResults.photos"
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
                <div class="photo-author">{{ photo.user.nickname }}</div>
              </div>
            </div>
          </div>
        </van-tab>
        
        <van-tab title="用户" name="users">
          <div class="users-list">
            <div
              v-for="user in searchResults.users"
              :key="user.id"
              class="user-item"
              @click="goToUserPage(user.id)"
            >
              <van-image
                :src="user.avatar"
                round
                width="48"
                height="48"
                class="user-avatar"
              />
              <div class="user-info">
                <div class="user-nickname">{{ user.nickname }}</div>
                <div class="user-stats">{{ user.followers }} 粉丝 · {{ user.photos }} 作品</div>
              </div>
              <van-button
                v-if="!user.isFollowing"
                type="primary"
                size="small"
                @click.stop="handleFollow(user)"
              >
                关注
              </van-button>
              <van-button
                v-else
                type="default"
                size="small"
                @click.stop="handleUnfollow(user)"
              >
                已关注
              </van-button>
            </div>
          </div>
        </van-tab>
        
        <van-tab title="标签" name="tags">
          <div class="tags-list">
            <div
              v-for="tag in searchResults.tags"
              :key="tag.name"
              class="tag-item"
              @click="searchByTag(tag.name)"
            >
              <van-tag type="primary" size="large">#{{ tag.name }}</van-tag>
              <span class="tag-count">{{ tag.count }} 作品</span>
            </div>
          </div>
        </van-tab>
      </van-tabs>
    </div>

    <!-- 无结果提示 -->
    <div v-if="hasSearched && isEmpty" class="empty-result">
      <van-empty description="没有找到相关内容" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()

const searchQuery = ref('')
const hasSearched = ref(false)
const activeTab = ref('photos')

// 搜索历史 - 从本地存储获取，避免使用假数据
const searchHistory = ref(localStorage.getItem('searchHistory') ? JSON.parse(localStorage.getItem('searchHistory')) : [])

// 热门标签 - 待后端API实现，目前使用默认空数组
const hotTags = ref([])

// 搜索结果
const searchResults = ref({
  photos: [],
  users: [],
  tags: []
})

// 判断结果是否为空
const isEmpty = computed(() => {
  return searchResults.value.photos.length === 0 && 
         searchResults.value.users.length === 0 && 
         searchResults.value.tags.length === 0
})

// 返回上一页
const goBack = () => {
  router.back()
}

// 执行搜索
const handleSearch = async () => {
  console.log('搜索开始，关键词:', searchQuery.value)
  if (!searchQuery.value.trim()) {
    console.log('搜索关键词为空，不执行搜索')
    return
  }
  
  hasSearched.value = true
  
  // 更新路由参数，保存搜索状态
  router.push({
    path: '/search',
    query: {
      q: searchQuery.value,
      type: activeTab.value
    }
  })
  
  // 添加到搜索历史
  if (!searchHistory.value.includes(searchQuery.value)) {
    searchHistory.value.unshift(searchQuery.value)
    if (searchHistory.value.length > 10) {
      searchHistory.value.pop()
    }
    // 保存到本地存储
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
  }
  
  try {
      // 调用后端API获取真实搜索结果
      console.log('发送搜索请求到API:', `/api/search?q=${encodeURIComponent(searchQuery.value)}&type=${activeTab.value}`)
      const response = await axios.get('/api/search', {
        params: {
          q: searchQuery.value,
          type: activeTab.value
        },
        timeout: 10000
      })
    
    console.log('搜索API响应:', response)
    
    if (response.data.success) {
      searchResults.value = response.data.data
      console.log('搜索结果更新:', searchResults.value)
    } else {
      console.log('搜索API返回失败:', response.data.message)
    }
  } catch (error) {
    console.error('搜索失败:', error)
    // 如果API调用失败，显示空结果
    searchResults.value = { photos: [], users: [], tags: [] }
  }
}

// 清除搜索
const handleClear = () => {
  searchQuery.value = ''
  hasSearched.value = false
  searchResults.value = { photos: [], users: [], tags: [] }
}

// 清除搜索历史
const clearHistory = () => {
  searchHistory.value = []
}

// 点击历史记录搜索
const searchHistoryItem = (item) => {
  searchQuery.value = item
  handleSearch()
}

// 点击热门标签搜索
const searchHotTag = (tag) => {
  searchQuery.value = tag
  handleSearch()
}

// 按标签搜索
const searchByTag = (tagName) => {
  searchQuery.value = tagName
  activeTab.value = 'photos'
  handleSearch()
}

// 跳转到图片详情
const goToPhotoDetail = (photoId) => {
  router.push(`/photo/${photoId}`)
}

// 跳转到用户页面
const goToUserPage = (userId) => {
  router.push(`/user/${userId}`)
}

// 关注用户
const handleFollow = (user) => {
  user.isFollowing = true
}

// 取消关注
const handleUnfollow = (user) => {
  user.isFollowing = false
}

onMounted(() => {
  // 初始化搜索页面，检查URL参数
  const q = route.query.q
  const type = route.query.type
  if (q) {
    searchQuery.value = q
    if (type && ['photos', 'users', 'tags'].includes(type)) {
      activeTab.value = type
    }
    handleSearch()
  }
})
</script>

<style scoped>
.search-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.nav-bar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.search-bar {
  padding: 16px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
}

.search-input {
  background: #f7f8fa;
}

.search-history {
  padding: 16px;
  background: white;
  margin-bottom: 8px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
}

.clear-btn {
  cursor: pointer;
  color: #999;
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.history-tag {
  cursor: pointer;
}

.hot-search {
  padding: 16px;
  background: white;
}

.hot-header {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.hot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hot-tag {
  cursor: pointer;
}

.search-results {
  background: white;
}

.result-tabs {
  background: white;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 8px;
}

.photo-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.photo-image {
  width: 100%;
  height: 200px;
}

.photo-info {
  padding: 8px;
}

.photo-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.photo-author {
  font-size: 12px;
  color: #999;
}

.users-list {
  padding: 8px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.user-item:last-child {
  border-bottom: none;
}

.user-avatar {
  margin-right: 12px;
}

.user-info {
  flex: 1;
}

.user-nickname {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.user-stats {
  font-size: 12px;
  color: #999;
}

.tags-list {
  padding: 8px;
}

.tag-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.tag-item:last-child {
  border-bottom: none;
}

.tag-count {
  font-size: 14px;
  color: #999;
}

.empty-result {
  padding: 60px 20px;
  text-align: center;
}
</style>