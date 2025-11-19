<template>
  <div class="home-container">
    <!-- 顶部搜索栏 -->
    <div class="header">
      <van-search
        v-model="searchKeyword"
        placeholder="搜索图片、用户"
        @search="handleSearch"
        @click="$router.push('/search')"
        readonly
      />
    </div>

    <!-- 标签栏 -->
    <van-tabs v-model:active="activeTab" @change="handleTabChange" class="tabs">
      <van-tab title="推荐" name="recommend">
        <PhotoList :photos="recommendPhotos" @load-more="loadMoreRecommend" />
      </van-tab>
      <van-tab title="关注" name="following">
        <PhotoList :photos="followingPhotos" @load-more="loadMoreFollowing" />
      </van-tab>
      <van-tab title="热门" name="popular">
        <PhotoList :photos="popularPhotos" @load-more="loadMorePopular" />
      </van-tab>
    </van-tabs>

    <!-- 底部导航 -->
    <van-tabbar v-model="active" class="tabbar">
      <van-tabbar-item icon="home-o" to="/home">首页</van-tabbar-item>
      <van-tabbar-item icon="plus" to="/publish">发布</van-tabbar-item>
      <van-tabbar-item icon="chat-o" to="/message" :badge="unreadCount">
        消息
      </van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/profile">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PhotoList from '@/components/PhotoList.vue'
import request from '@/utils/request'
import { showToast } from 'vant'

const router = useRouter()

const active = ref(0)
const activeTab = ref('recommend')
const searchKeyword = ref('')
const unreadCount = ref(0) // 从后端获取真实未读消息数量，当前默认0

const recommendPhotos = ref([])
const followingPhotos = ref([])
const popularPhotos = ref([])

// 加载状态和分页信息
const loading = ref(false)
const loadMoreLoading = ref({
  recommend: false,
  following: false,
  popular: false
})
const pagination = ref({
  recommend: { current: 1, pageSize: 20, pages: 1 },
  following: { current: 1, pageSize: 20, pages: 1 },
  popular: { current: 1, pageSize: 20, pages: 1 }
})

// 处理搜索
const handleSearch = (keyword) => {
  if (keyword.trim()) {
    router.push(`/search?q=${encodeURIComponent(keyword)}`)
  }
}

// 处理标签切换
const handleTabChange = (name) => {
  // 根据标签加载不同数据
  if ((name === 'recommend' && recommendPhotos.value.length === 0) ||
      (name === 'following' && followingPhotos.value.length === 0) ||
      (name === 'popular' && popularPhotos.value.length === 0)) {
    loadPhotos(name)
  }
}

// 加载图片数据
const loadPhotos = async (type) => {
  try {
    loading.value = true
    
    // 根据类型确定排序方式
    let sort = 'latest'
    if (type === 'popular') {
      sort = 'popular'
    } else if (type === 'following') {
      // 关注的照片暂时使用最新排序，实际项目中可能需要单独的API
      sort = 'latest'
    }
    
    const response = await request.get('/photos', {
      params: {
        page: 1,
        limit: pagination.value[type].pageSize,
        sort: sort
      }
    })
    
    if (response.data.success) {
      const { photos, pagination: pageInfo } = response.data.data
      
      // 根据类型更新数据
      if (type === 'recommend') {
        recommendPhotos.value = photos
      } else if (type === 'following') {
        followingPhotos.value = photos
      } else if (type === 'popular') {
        popularPhotos.value = photos
      }
      
      // 更新分页信息
      pagination.value[type] = {
        ...pagination.value[type],
        current: 1,
        pages: pageInfo.pages
      }
    }
  } catch (error) {
    console.error('加载图片失败:', error)
    showToast('加载图片失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 加载更多推荐图片
const loadMoreRecommend = async () => {
  if (loadMoreLoading.value.recommend) return
  if (pagination.value.recommend.current >= pagination.value.recommend.pages) return
  
  try {
    loadMoreLoading.value.recommend = true
    const nextPage = pagination.value.recommend.current + 1
    
    const response = await request.get('/photos', {
      params: {
        page: nextPage,
        limit: pagination.value.recommend.pageSize,
        sort: 'latest'
      }
    })
    
    if (response.data.success) {
      const { photos, pagination: pageInfo } = response.data.data
      recommendPhotos.value.push(...photos)
      
      // 更新分页信息
      pagination.value.recommend = {
        ...pagination.value.recommend,
        current: nextPage,
        pages: pageInfo.pages
      }
    }
  } catch (error) {
    console.error('加载更多推荐图片失败:', error)
    showToast('加载更多图片失败，请稍后重试')
  } finally {
    loadMoreLoading.value.recommend = false
  }
}

// 加载更多关注图片
const loadMoreFollowing = async () => {
  if (loadMoreLoading.value.following) return
  if (pagination.value.following.current >= pagination.value.following.pages) return
  
  try {
    loadMoreLoading.value.following = true
    const nextPage = pagination.value.following.current + 1
    
    const response = await request.get('/photos', {
      params: {
        page: nextPage,
        limit: pagination.value.following.pageSize,
        sort: 'latest'
      }
    })
    
    if (response.data.success) {
      const { photos, pagination: pageInfo } = response.data.data
      followingPhotos.value.push(...photos)
      
      // 更新分页信息
      pagination.value.following = {
        ...pagination.value.following,
        current: nextPage,
        pages: pageInfo.pages
      }
    }
  } catch (error) {
    console.error('加载更多关注图片失败:', error)
    showToast('加载更多图片失败，请稍后重试')
  } finally {
    loadMoreLoading.value.following = false
  }
}

// 加载更多热门图片
const loadMorePopular = async () => {
  if (loadMoreLoading.value.popular) return
  if (pagination.value.popular.current >= pagination.value.popular.pages) return
  
  try {
    loadMoreLoading.value.popular = true
    const nextPage = pagination.value.popular.current + 1
    
    const response = await request.get('/photos', {
      params: {
        page: nextPage,
        limit: pagination.value.popular.pageSize,
        sort: 'popular'
      }
    })
    
    if (response.data.success) {
      const { photos, pagination: pageInfo } = response.data.data
      popularPhotos.value.push(...photos)
      
      // 更新分页信息
      pagination.value.popular = {
        ...pagination.value.popular,
        current: nextPage,
        pages: pageInfo.pages
      }
    }
  } catch (error) {
    console.error('加载更多热门图片失败:', error)
    showToast('加载更多图片失败，请稍后重试')
  } finally {
    loadMoreLoading.value.popular = false
  }
}

onMounted(() => {
  loadPhotos('recommend')
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 50px;
}

.header {
  background: white;
  padding: 10px 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.tabs {
  background: white;
  margin-top: 2px;
}

.tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}
</style>