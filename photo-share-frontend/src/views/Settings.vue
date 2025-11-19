<template>
  <div class="settings-container">
    <van-nav-bar
      title="设置"
      left-arrow
      @click-left="goBack"
      class="nav-bar"
    />

    <div class="settings-content">
      <!-- 账号设置 -->
      <div class="settings-section">
        <div class="section-title">账号设置</div>
        <van-cell-group>
          <van-cell
            title="个人资料"
            is-link
            @click="goToEditProfile"
            icon="contact"
          />
          <van-cell
            title="账号安全"
            is-link
            @click="goToSecurity"
            icon="shield-o"
          />
          <van-cell
            title="隐私设置"
            is-link
            @click="goToPrivacy"
            icon="shield-o"
          />
        </van-cell-group>
      </div>

      <!-- 通知设置 -->
      <div class="settings-section">
        <div class="section-title">通知设置</div>
        <van-cell-group>
          <van-cell
            title="推送通知"
            :value="notificationEnabled ? '已开启' : '已关闭'"
          >
            <template #right-icon>
              <van-switch
                v-model="notificationEnabled"
                @change="handleNotificationChange"
              />
            </template>
          </van-cell>
          <van-cell
            title="消息提醒"
            :value="messageEnabled ? '已开启' : '已关闭'"
          >
            <template #right-icon>
              <van-switch
                v-model="messageEnabled"
                @change="handleMessageChange"
              />
            </template>
          </van-cell>
          <van-cell
            title="点赞提醒"
            :value="likeEnabled ? '已开启' : '已关闭'"
          >
            <template #right-icon>
              <van-switch
                v-model="likeEnabled"
                @change="handleLikeChange"
              />
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <!-- 通用设置 -->
      <div class="settings-section">
        <div class="section-title">通用设置</div>
        <van-cell-group>
          <van-cell
            title="主题模式"
            :value="themeMode === 'dark' ? '深色模式' : '浅色模式'"
            is-link
            @click="showThemePicker"
            icon="setting-o"
          />
          <van-cell
            title="语言设置"
            value="简体中文"
            is-link
            @click="showLanguagePicker"
            icon="globe-o"
          />
          <van-cell
            title="清除缓存"
            is-link
            @click="clearCache"
            icon="delete-o"
          />
        </van-cell-group>
      </div>

      <!-- 关于 -->
      <div class="settings-section">
        <div class="section-title">关于</div>
        <van-cell-group>
          <van-cell
            title="用户协议"
            is-link
            @click="showUserAgreement"
            icon="description"
          />
          <van-cell
            title="隐私政策"
            is-link
            @click="showPrivacyPolicy"
            icon="shield-o"
          />
          <van-cell
            title="帮助与反馈"
            is-link
            @click="showHelp"
            icon="question-o"
          />
          <van-cell
            title="关于我们"
            :value="`版本 ${version}`"
            is-link
            @click="showAbout"
            icon="info-o"
          />
        </van-cell-group>
      </div>

      <!-- 退出登录 -->
      <div class="logout-section">
        <van-button
          type="danger"
          block
          @click="handleLogout"
          class="logout-btn"
        >
          退出登录
        </van-button>
      </div>
    </div>

    <!-- 主题选择器 -->
    <van-action-sheet
      v-model:show="showTheme"
      :actions="themeActions"
      @select="onThemeSelect"
      cancel-text="取消"
    />

    <!-- 语言选择器 -->
    <van-action-sheet
      v-model:show="showLanguage"
      :actions="languageActions"
      @select="onLanguageSelect"
      cancel-text="取消"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { showConfirmDialog, showSuccessToast } from 'vant'

const router = useRouter()
const userStore = useUserStore()

const version = '1.0.0'

// 通知设置
const notificationEnabled = ref(true)
const messageEnabled = ref(true)
const likeEnabled = ref(true)

// 主题和语言
const themeMode = ref('light')
const showTheme = ref(false)
const showLanguage = ref(false)

const themeActions = [
  { name: '浅色模式', value: 'light' },
  { name: '深色模式', value: 'dark' },
  { name: '跟随系统', value: 'auto' }
]

const languageActions = [
  { name: '简体中文', value: 'zh-CN' },
  { name: '繁體中文', value: 'zh-TW' },
  { name: 'English', value: 'en' }
]

// 返回上一页
const goBack = () => {
  router.back()
}

// 跳转到编辑资料
const goToEditProfile = () => {
  router.push('/profile/edit')
}

// 跳转到账号安全
const goToSecurity = () => {
  console.log('跳转到账号安全')
}

// 跳转到隐私设置
const goToPrivacy = () => {
  console.log('跳转到隐私设置')
}

// 处理通知设置
const handleNotificationChange = (value) => {
  console.log('推送通知:', value)
}

const handleMessageChange = (value) => {
  console.log('消息提醒:', value)
}

const handleLikeChange = (value) => {
  console.log('点赞提醒:', value)
}

// 显示主题选择器
const showThemePicker = () => {
  showTheme.value = true
}

// 主题选择
const onThemeSelect = (action) => {
  themeMode.value = action.value
  showTheme.value = false
  console.log('选择主题:', action.value)
}

// 显示语言选择器
const showLanguagePicker = () => {
  showLanguage.value = true
}

// 语言选择
const onLanguageSelect = (action) => {
  showLanguage.value = false
  console.log('选择语言:', action.value)
}

// 清除缓存
const clearCache = () => {
  showConfirmDialog({
    title: '确认清除',
    message: '确定要清除所有缓存数据吗？',
  }).then(() => {
    // 清除缓存逻辑
    showSuccessToast('缓存已清除')
  }).catch(() => {
    // 取消操作
  })
}

// 显示用户协议
const showUserAgreement = () => {
  console.log('显示用户协议')
}

// 显示隐私政策
const showPrivacyPolicy = () => {
  console.log('显示隐私政策')
}

// 显示帮助
const showHelp = () => {
  console.log('显示帮助')
}

// 显示关于我们
const showAbout = () => {
  console.log('显示关于我们')
}

// 退出登录
const handleLogout = () => {
  showConfirmDialog({
    title: '确认退出',
    message: '确定要退出登录吗？',
  }).then(() => {
    userStore.logout()
    router.replace('/login')
  }).catch(() => {
    // 取消操作
  })
}
</script>

<style scoped>
.settings-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.nav-bar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.settings-content {
  padding: 16px;
}

.settings-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  padding-left: 4px;
}

.logout-section {
  margin-top: 32px;
  padding: 0 16px;
}

.logout-btn {
  height: 44px;
  border-radius: 8px;
}
</style>