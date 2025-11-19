<template>
  <div class="profile-container">
    <!-- 用户信息头部 -->
    <div class="profile-header">
      <div class="cover-image">
        <img src="https://picsum.photos/seed/cover/400/200.jpg" alt="封面" />
      </div>
      
      <div class="user-info">
        <van-image
          :src="userStore.user?.avatar || 'https://picsum.photos/seed/avatar/100/100.jpg'"
          round
          width="80"
          height="80"
          class="avatar"
          @click="showAvatarActions = true"
        />
        
        <div class="user-details">
          <h2 class="nickname">{{ userStore.user?.nickname || '未设置昵称' }}</h2>
          <p class="bio">{{ userStore.user?.bio || '这个人很懒，什么都没写' }}</p>
        </div>
        
        <van-button
          type="primary"
          size="small"
          @click="$router.push('/settings')"
          class="edit-btn"
        >
          编辑资料
        </van-button>
      </div>
      
      <!-- 统计信息 -->
      <div class="stats">
        <div class="stat-item" @click="viewWorks">
          <div class="stat-number">{{ userStats.worksCount }}</div>
          <div class="stat-label">作品</div>
        </div>
        <div class="stat-item" @click="viewFollowers">
          <div class="stat-number">{{ userStats.followersCount }}</div>
          <div class="stat-label">粉丝</div>
        </div>
        <div class="stat-item" @click="viewFollowing">
          <div class="stat-number">{{ userStats.followingCount }}</div>
          <div class="stat-label">关注</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ userStats.likesCount }}</div>
          <div class="stat-label">获赞</div>
        </div>
      </div>
    </div>

    <!-- 功能菜单 -->
    <div class="menu-section">
      <van-cell-group>
        <van-cell
          title="我的作品"
          icon="photo-o"
          is-link
          @click="viewWorks"
        />
        <van-cell
          title="我的收藏"
          icon="star-o"
          is-link
          @click="viewFavorites"
        />
        <van-cell
          title="浏览历史"
          icon="clock-o"
          is-link
          @click="viewHistory"
        />
      </van-cell-group>

      <van-cell-group>
        <van-cell
          title="账号设置"
          icon="setting-o"
          is-link
          @click="$router.push('/settings')"
        />
        <van-cell
          title="隐私设置"
          icon="shield-o"
          is-link
          @click="viewPrivacySettings"
        />
        <van-cell
          title="帮助与反馈"
          icon="question-o"
          is-link
          @click="viewHelp"
        />
      </van-cell-group>

      <van-cell-group>
        <van-cell
          title="关于我们"
          icon="info-o"
          is-link
          @click="viewAbout"
        />
        <van-cell
          title="退出登录"
          icon="sign-out"
          @click="handleLogout"
          class="logout-cell"
        />
      </van-cell-group>
    </div>

    <!-- 底部导航 -->
    <van-tabbar v-model="active" class="tabbar">
      <van-tabbar-item icon="home-o" to="/home">首页</van-tabbar-item>
      <van-tabbar-item icon="plus" to="/publish">发布</van-tabbar-item>
      <van-tabbar-item icon="chat-o" to="/message" :badge="unreadCount">
        消息
      </van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/profile">我的</van-tabbar-item>
    </van-tabbar>

    <!-- 头像操作弹窗 -->
    <van-action-sheet
      v-model:show="showAvatarActions"
      :actions="avatarActions"
      @select="handleAvatarAction"
      cancel-text="取消"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { showConfirmDialog, showSuccessToast } from 'vant'

const router = useRouter()
const userStore = useUserStore()

const active = ref(3)
const showAvatarActions = ref(false)
const unreadCount = ref(0) // 从后端获取真实未读消息数量，当前默认0

// 用户统计信息
const userStats = ref({
  worksCount: 0,
  followersCount: 0,
  followingCount: 0,
  likesCount: 0
})

// 头像操作选项
const avatarActions = [
  { name: '查看头像', value: 'view' },
  { name: '更换头像', value: 'change' }
]

// 查看作品
const viewWorks = () => {
  router.push(`/user/${userStore.user?.id}`)
}

// 查看粉丝
const viewFollowers = () => {
  router.push(`/user/${userStore.user?.id}?tab=followers`)
}

// 查看关注
const viewFollowing = () => {
  router.push(`/user/${userStore.user?.id}?tab=following`)
}

// 查看收藏
const viewFavorites = () => {
  router.push('/favorites')
}

// 查看历史
const viewHistory = () => {
  router.push('/history')
}

// 查看隐私设置
const viewPrivacySettings = () => {
  router.push('/privacy')
}

// 查看帮助
const viewHelp = () => {
  router.push('/help')
}

// 查看关于
const viewAbout = () => {
  router.push('/about')
}

// 处理头像操作
const handleAvatarAction = (action) => {
  if (action.value === 'view') {
    // 查看头像大图
    // 可以使用ImagePreview组件
  } else if (action.value === 'change') {
    router.push('/settings?section=avatar')
  }
  showAvatarActions.value = false
}

// 处理退出登录
const handleLogout = () => {
  showConfirmDialog({
    title: '确认退出',
    message: '确定要退出登录吗？',
  }).then(() => {
    userStore.logout()
    showSuccessToast('已退出登录')
    router.push('/login')
  }).catch(() => {
    // 取消退出
  })
}

onMounted(async () => {
  // 获取用户信息
  if (userStore.token) {
    await userStore.fetchUserProfile()
    // 更新用户统计信息
    if (userStore.user) {
      userStats.value = {
        worksCount: userStore.user.stats?.photos || 0,
        followersCount: userStore.user.stats?.followers || 0,
        followingCount: userStore.user.stats?.following || 0,
        likesCount: userStore.user.likes || 0
      }
    }
  }
})
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 50px;
}

.profile-header {
  background: white;
  margin-bottom: 12px;
}

.cover-image {
  height: 150px;
  overflow: hidden;
}

.cover-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  position: relative;
  padding: 0 16px 20px;
  margin-top: -40px;
}

.avatar {
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.user-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 12px;
  text-align: center;
}

.nickname {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.bio {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.4;
}

.edit-btn {
  position: absolute;
  right: 16px;
  top: 20px;
}

.stats {
  display: flex;
  justify-content: space-around;
  padding: 20px 0;
  border-top: 1px solid #f0f0f0;
}

.stat-item {
  text-align: center;
  cursor: pointer;
  flex: 1;
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

.menu-section {
  margin-bottom: 12px;
}

.logout-cell {
  color: #ee0a24;
}

.tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}
</style>