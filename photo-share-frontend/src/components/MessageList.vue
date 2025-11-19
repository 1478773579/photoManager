<template>
  <div class="message-list">
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <div
          v-for="message in messages"
          :key="message.id"
          class="message-item"
          :class="{ 'unread': !message.isRead }"
          @click="handleMessageClick(message)"
        >
          <van-image
            :src="message.user.avatar"
            round
            width="48"
            height="48"
            class="user-avatar"
          />
          
          <div class="message-content">
            <div class="message-header">
              <span class="user-nickname">{{ message.user.nickname }}</span>
              <span class="message-time">{{ message.createdAt }}</span>
            </div>
            
            <div class="message-text">{{ message.content }}</div>
            
            <div v-if="message.targetImage" class="target-image">
              <van-image
                :src="message.targetImage"
                width="60"
                height="60"
                fit="cover"
                radius="4"
              />
            </div>
          </div>
          
          <div v-if="!message.isRead" class="unread-dot"></div>
        </div>
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  }
})

const router = useRouter()

const refreshing = ref(false)
const loading = ref(false)
const finished = ref(false)

// 下拉刷新
const onRefresh = () => {
  // 模拟刷新
  setTimeout(() => {
    refreshing.value = false
  }, 1000)
}

// 加载更多
const onLoad = () => {
  // 模拟加载更多
  setTimeout(() => {
    loading.value = false
    finished.value = true
  }, 1000)
}

// 处理消息点击
const handleMessageClick = (message) => {
  // 标记为已读
  message.isRead = true
  
  // 根据消息类型跳转到对应页面
  if (message.type === 'like' || message.type === 'comment') {
    // 跳转到图片详情页
    router.push(`/photo/${message.photoId}`)
  } else if (message.type === 'follow') {
    // 跳转到用户主页
    router.push(`/user/${message.user.id}`)
  }
}
</script>

<style scoped>
.message-list {
  background: white;
}

.message-item {
  display: flex;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.message-item:hover {
  background-color: #f9f9f9;
}

.message-item.unread {
  background-color: #f8f9ff;
}

.user-avatar {
  flex-shrink: 0;
  margin-right: 12px;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.user-nickname {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.message-time {
  font-size: 12px;
  color: #999;
}

.message-text {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  margin-bottom: 8px;
}

.target-image {
  margin-top: 8px;
}

.unread-dot {
  position: absolute;
  top: 20px;
  right: 16px;
  width: 8px;
  height: 8px;
  background-color: #ee0a24;
  border-radius: 50%;
}
</style>