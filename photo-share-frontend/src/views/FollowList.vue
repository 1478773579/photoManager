<template>
  <div class="follow-list-container">
    <van-nav-bar
      :title="title"
      left-arrow
      @click-left="goBack"
      class="nav-bar"
    />

    <div class="list-content">
      <van-loading v-if="loading" class="loading" />
      
      <template v-else>
        <div v-if="users.length === 0" class="empty-state">
          <van-empty
            :description="emptyDescription"
            image="https://fastly.jsdelivr.net/npm/@vant/assets/custom-empty-image.png"
          />
        </div>
        
        <div v-else class="user-list">
          <div
            v-for="user in users"
            :key="user.id"
            class="user-item"
            @click="goToUserProfile(user.id)"
          >
            <van-image
              :src="user.avatar || 'https://picsum.photos/seed/avatar' + user.id + '/50/50.jpg'"
              round
              width="50"
              height="50"
              class="user-avatar"
            />
            
            <div class="user-info">
              <div class="user-name">
                <span class="nickname">{{ user.nickname }}</span>
                <van-icon v-if="user.isVerified" name="verified" color="#1e90ff" class="verified-icon" />
              </div>
              <div v-if="user.bio" class="user-bio">{{ user.bio }}</div>
            </div>
            
            <van-button
              v-if="!isCurrentUser && user.id !== currentUserId"
              :type="user.isFollowing ? 'default' : 'primary'"
              size="small"
              :loading="user.following"
              @click.stop="toggleFollow(user)"
              class="follow-btn"
            >
              {{ user.isFollowing ? '已关注' : '关注' }}
            </van-button>
          </div>
        </div>
        
        <!-- 加载更多 -->
        <div v-if="hasMore" class="load-more">
          <van-loading v-if="loadingMore" />
          <van-button v-else @click="loadMore" plain>加载更多</van-button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'
import { showToast } from 'vant'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const loadingMore = ref(false)
const users = ref([])
const currentPage = ref(1)
const pageSize = 20
const total = ref(0)

const userId = computed(() => route.params.userId)
const type = computed(() => route.params.type) // 'following' 或 'followers'

const title = computed(() => {
  if (type.value === 'following') {
    return '关注列表'
  } else {
    return '粉丝列表'
  }
})

const emptyDescription = computed(() => {
  if (type.value === 'following') {
    return '还没有关注任何人'
  } else {
    return '还没有粉丝'
  }
})

const isCurrentUser = computed(() => {
  return userId.value === userStore.userInfo?.id?.toString()
})

const currentUserId = computed(() => {
  return userStore.userInfo?.id
})

const hasMore = computed(() => {
  return users.value.length < total.value
})

// 加载关注/粉丝列表
const loadFollowList = async (page = 1, append = false) => {
  try {
    if (page === 1) {
      loading.value = true
    } else {
      loadingMore.value = true
    }
    
    // 检查userId是否有效
    if (!userId.value || isNaN(parseInt(userId.value))) {
      console.error('无效的用户ID:', userId.value)
      showToast('无效的用户ID')
      router.push('/') // 重定向到首页
      return
    }

    const url = type.value === 'following' 
      ? `/api/follows/${userId.value}/following`
      : `/api/follows/${userId.value}/followers`

    const response = await request.get(url, {
      params: {
        page,
        limit: pageSize
      }
    })

    if (response.data.success) {
      const newUsers = response.data.data.follows
      
      if (append) {
        users.value = [...users.value, ...newUsers]
      } else {
        users.value = newUsers
      }
      
      total.value = response.data.data.pagination.total
      currentPage.value = page
    }
  } catch (error) {
    console.error('加载列表失败:', error)
    showToast('加载失败')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 加载更多
const loadMore = () => {
  if (hasMore.value && !loadingMore.value) {
    loadFollowList(currentPage.value + 1, true)
  }
}

// 切换关注状态
const toggleFollow = async (user) => {
  try {
    user.following = true
    
    if (user.isFollowing) {
      // 取消关注
      await request.delete(`/api/follows/${user.id}`)
      user.isFollowing = false
      showToast('已取消关注')
    } else {
      // 关注
      await request.post(`/api/follows/${user.id}`)
      user.isFollowing = true
      showToast('关注成功')
    }
  } catch (error) {
    console.error('操作失败:', error)
    showToast(error.response?.data?.message || '操作失败')
  } finally {
    user.following = false
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 跳转到用户主页
const goToUserProfile = (targetUserId) => {
  router.push(`/user/${targetUserId}`)
}

onMounted(() => {
  // 检查userId是否有效
  if (!userId.value || isNaN(parseInt(userId.value))) {
    console.error('无效的用户ID:', userId.value)
    showToast('无效的用户ID')
    router.push('/') // 重定向到首页
    return
  }
  
  loadFollowList()
})
</script>

<style scoped>
.follow-list-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.nav-bar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.list-content {
  padding-top: 1px;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.empty-state {
  padding: 60px 20px;
}

.user-list {
  background: white;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.user-item:hover {
  background-color: #f8f9fa;
}

.user-item:last-child {
  border-bottom: none;
}

.user-avatar {
  margin-right: 12px;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.nickname {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-right: 4px;
}

.verified-icon {
  font-size: 14px;
}

.user-bio {
  font-size: 14px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.follow-btn {
  flex-shrink: 0;
  margin-left: 12px;
  min-width: 60px;
}

.load-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: white;
}
</style>