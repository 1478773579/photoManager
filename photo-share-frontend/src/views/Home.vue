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

const router = useRouter()

const active = ref(0)
const activeTab = ref('recommend')
const searchKeyword = ref('')
const unreadCount = ref(3) // 模拟未读消息数量

const recommendPhotos = ref([])
const followingPhotos = ref([])
const popularPhotos = ref([])

// 模拟数据
const mockPhotos = [
  {
    id: 1,
    user: {
      id: 1,
      nickname: '摄影师小王',
      avatar: 'https://picsum.photos/seed/user1/100/100.jpg'
    },
    imageUrl: 'https://picsum.photos/seed/photo1/400/500.jpg',
    thumbnailUrl: 'https://picsum.photos/seed/photo1/200/250.jpg',
    title: '美丽的夕阳',
    description: '今天拍的夕阳，太美了！',
    likesCount: 128,
    commentsCount: 23,
    viewsCount: 1024,
    createdAt: '2024-01-15 18:30',
    isLiked: false
  },
  {
    id: 2,
    user: {
      id: 2,
      nickname: '旅行达人',
      avatar: 'https://picsum.photos/seed/user2/100/100.jpg'
    },
    imageUrl: 'https://picsum.photos/seed/photo2/400/600.jpg',
    thumbnailUrl: 'https://picsum.photos/seed/photo2/200/300.jpg',
    title: '山间小径',
    description: '徒步旅行的美好时光',
    likesCount: 256,
    commentsCount: 45,
    viewsCount: 2048,
    createdAt: '2024-01-15 14:20',
    isLiked: true
  }
]

// 处理搜索
const handleSearch = (keyword) => {
  if (keyword.trim()) {
    router.push(`/search?q=${encodeURIComponent(keyword)}`)
  }
}

// 处理标签切换
const handleTabChange = (name) => {
  // 根据标签加载不同数据
  loadPhotos(name)
}

// 加载图片数据
const loadPhotos = async (type) => {
  try {
    // 这里应该调用API获取数据
    // const response = await request.get(`/photos?type=${type}`)
    
    // 模拟数据
    if (type === 'recommend') {
      recommendPhotos.value = [...mockPhotos]
    } else if (type === 'following') {
      followingPhotos.value = [...mockPhotos]
    } else if (type === 'popular') {
      popularPhotos.value = [...mockPhotos]
    }
  } catch (error) {
    console.error('加载图片失败:', error)
  }
}

// 加载更多推荐图片
const loadMoreRecommend = () => {
  // 模拟加载更多
  setTimeout(() => {
    recommendPhotos.value.push(...mockPhotos)
  }, 1000)
}

// 加载更多关注图片
const loadMoreFollowing = () => {
  // 模拟加载更多
  setTimeout(() => {
    followingPhotos.value.push(...mockPhotos)
  }, 1000)
}

// 加载更多热门图片
const loadMorePopular = () => {
  // 模拟加载更多
  setTimeout(() => {
    popularPhotos.value.push(...mockPhotos)
  }, 1000)
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