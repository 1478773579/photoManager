<template>
  <div class="message-container">
    <van-nav-bar
      title="消息"
      class="nav-bar"
    />

    <!-- 消息类型标签 -->
    <van-tabs v-model:active="activeTab" class="message-tabs">
      <van-tab title="全部" name="all">
        <MessageList :messages="allMessages" />
      </van-tab>
      <van-tab title="点赞" name="likes">
        <MessageList :messages="likeMessages" />
      </van-tab>
      <van-tab title="评论" name="comments">
        <MessageList :messages="commentMessages" />
      </van-tab>
      <van-tab title="关注" name="follows">
        <MessageList :messages="followMessages" />
      </van-tab>
      <van-tab title="系统" name="system">
        <MessageList :messages="systemMessages" />
      </van-tab>
    </van-tabs>

    <!-- 底部导航 -->
    <van-tabbar v-model="active" class="tabbar">
      <van-tabbar-item icon="home-o" to="/home">首页</van-tabbar-item>
      <van-tabbar-item icon="plus" to="/publish">发布</van-tabbar-item>
      <van-tabbar-item icon="chat-o" to="/message">
        消息
      </van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/profile">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MessageList from '@/components/MessageList.vue'

const active = ref(2)
const activeTab = ref('all')

// 模拟消息数据
const mockMessages = [
  {
    id: 1,
    type: 'like',
    user: {
      id: 1,
      nickname: '摄影师小王',
      avatar: 'https://picsum.photos/seed/user1/100/100.jpg'
    },
    content: '赞了你的作品《美丽的夕阳》',
    targetImage: 'https://picsum.photos/seed/photo1/100/100.jpg',
    createdAt: '2分钟前',
    isRead: false
  },
  {
    id: 2,
    type: 'comment',
    user: {
      id: 2,
      nickname: '旅行达人',
      avatar: 'https://picsum.photos/seed/user2/100/100.jpg'
    },
    content: '评论了你的作品：拍得真好！',
    targetImage: 'https://picsum.photos/seed/photo2/100/100.jpg',
    createdAt: '10分钟前',
    isRead: false
  }
]

const allMessages = ref([])
const likeMessages = ref([])
const commentMessages = ref([])
const followMessages = ref([])
const systemMessages = ref([])

// 加载消息数据
const loadMessages = () => {
  allMessages.value = [...mockMessages]
  likeMessages.value = mockMessages.filter(msg => msg.type === 'like')
  commentMessages.value = mockMessages.filter(msg => msg.type === 'comment')
  followMessages.value = mockMessages.filter(msg => msg.type === 'follow')
  systemMessages.value = []
}

onMounted(() => {
  loadMessages()
})
</script>

<style scoped>
.message-container {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 50px;
}

.nav-bar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.message-tabs {
  background: white;
}

.tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}
</style>