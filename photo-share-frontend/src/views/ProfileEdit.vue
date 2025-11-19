<template>
  <div class="profile-edit-container">
    <van-nav-bar
      title="编辑资料"
      left-arrow
      @click-left="goBack"
      class="nav-bar"
    />

    <div class="edit-form">
      <!-- 头像编辑 -->
      <div class="form-section">
        <div class="section-title">头像</div>
        <div class="avatar-edit" @click="editAvatar">
          <van-image
            :src="form.avatar || 'https://picsum.photos/seed/default/100/100.jpg'"
            round
            width="60"
            height="60"
            class="avatar-img"
          />
          <van-icon name="camera-o" class="edit-icon" />
        </div>
      </div>

      <!-- 封面图编辑 -->
      <div class="form-section">
        <div class="section-title">封面图</div>
        <div class="cover-edit" @click="editCover">
          <van-image
            :src="form.coverImage || 'https://picsum.photos/seed/cover/400/200.jpg'"
            fit="cover"
            class="cover-img"
          />
          <div class="cover-overlay">
            <van-icon name="camera-o" />
            <span>更换封面</span>
          </div>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="form-section">
        <van-cell-group inset>
          <van-field
            v-model="form.nickname"
            label="昵称"
            placeholder="请输入昵称"
            :rules="[{ required: true, message: '请输入昵称' }]"
            maxlength="20"
            show-word-limit
          />
          <van-field
            v-model="form.bio"
            label="个人简介"
            type="textarea"
            placeholder="介绍一下自己吧"
            rows="3"
            maxlength="200"
            show-word-limit
          />
          <van-field
            v-model="form.gender"
            label="性别"
            placeholder="请选择性别"
            readonly
            is-link
            @click="showGenderPicker = true"
          />
          <van-field
            v-model="form.birthday"
            label="生日"
            placeholder="请选择生日"
            readonly
            is-link
            @click="showBirthdayPicker = true"
          />
          <van-field
            v-model="form.location"
            label="所在地"
            placeholder="请输入所在地"
          />
          <van-field
            v-model="form.website"
            label="个人网站"
            placeholder="请输入个人网站"
          />
        </van-cell-group>
      </div>

      <!-- 保存按钮 -->
      <div class="save-section">
        <van-button
          type="primary"
          block
          :loading="saving"
          @click="saveProfile"
          class="save-btn"
        >
          保存
        </van-button>
      </div>
    </div>

    <!-- 性别选择器 -->
    <van-popup v-model:show="showGenderPicker" position="bottom">
      <van-picker
        :columns="genderColumns"
        @confirm="onGenderConfirm"
        @cancel="showGenderPicker = false"
      />
    </van-popup>

    <!-- 生日选择器 -->
    <van-popup v-model:show="showBirthdayPicker" position="bottom">
      <van-date-picker
        v-model="birthdayValue"
        @confirm="onBirthdayConfirm"
        @cancel="showBirthdayPicker = false"
        :max-date="maxDate"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'
import { showToast } from 'vant'

const router = useRouter()
const userStore = useUserStore()

const saving = ref(false)
const showGenderPicker = ref(false)
const showBirthdayPicker = ref(false)
const birthdayValue = ref(new Date())

const maxDate = new Date()

const genderColumns = [
  { text: '男', value: 'male' },
  { text: '女', value: 'female' },
  { text: '保密', value: 'secret' }
]

const form = ref({
  nickname: '',
  bio: '',
  gender: '',
  birthday: '',
  location: '',
  website: '',
  avatar: '',
  coverImage: ''
})

// 加载用户信息
const loadUserInfo = async () => {
  try {
    const response = await request.get('/api/users/me/info')
    
    if (response.data.success) {
      const userData = response.data.data
      form.value = {
        nickname: userData.nickname || '',
        bio: userData.bio || '',
        gender: userData.gender || '',
        birthday: userData.birthday || '',
        location: userData.location || '',
        website: userData.website || '',
        avatar: userData.avatar || '',
        coverImage: userData.coverImage || ''
      }
      
      // 设置性别显示
      if (userData.gender) {
        const genderOption = genderColumns.find(g => g.value === userData.gender)
        if (genderOption) {
          form.value.gender = genderOption.text
        }
      }
      
      // 设置生日
      if (userData.birthday) {
        birthdayValue.value = new Date(userData.birthday)
      }
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
    showToast('加载用户信息失败')
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 编辑头像
const editAvatar = () => {
  showToast('头像上传功能开发中')
}

// 编辑封面
const editCover = () => {
  showToast('封面上传功能开发中')
}

// 性别确认
const onGenderConfirm = ({ selectedOptions }) => {
  form.value.gender = selectedOptions[0].text
  showGenderPicker.value = false
}

// 生日确认
const onBirthdayConfirm = () => {
  const date = birthdayValue.value
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  form.value.birthday = `${year}-${month}-${day}`
  showBirthdayPicker.value = false
}

// 保存资料
const saveProfile = async () => {
  try {
    saving.value = true
    
    // 验证必填字段
    if (!form.value.nickname.trim()) {
      showToast('请输入昵称')
      return
    }
    
    if (form.value.nickname.length < 2 || form.value.nickname.length > 20) {
      showToast('昵称长度应在2-20个字符之间')
      return
    }
    
    // 转换性别值
    let genderValue = ''
    const genderOption = genderColumns.find(g => g.text === form.value.gender)
    if (genderOption) {
      genderValue = genderOption.value
    }
    
    const updateData = {
      nickname: form.value.nickname.trim(),
      bio: form.value.bio.trim(),
      gender: genderValue,
      birthday: form.value.birthday,
      location: form.value.location.trim(),
      website: form.value.website.trim()
    }
    
    const response = await request.put('/api/users/profile', updateData)
    
    if (response.data.success) {
      // 更新store中的用户信息
      await userStore.updateProfile(updateData)
      showToast('保存成功')
      router.back()
    }
  } catch (error) {
    console.error('保存失败:', error)
    showToast(error.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.profile-edit-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.nav-bar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.edit-form {
  padding: 16px 0;
}

.form-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding: 0 16px;
}

.avatar-edit {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: white;
  margin: 0 16px;
  border-radius: 8px;
  position: relative;
  cursor: pointer;
}

.avatar-img {
  border: 2px solid #f0f0f0;
}

.edit-icon {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: #667eea;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.cover-edit {
  position: relative;
  margin: 0 16px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.cover-img {
  width: 100%;
  height: 120px;
  display: block;
}

.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.cover-edit:hover .cover-overlay {
  opacity: 1;
}

.cover-overlay .van-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.save-section {
  padding: 24px 16px;
}

.save-btn {
  height: 44px;
  font-size: 16px;
}
</style>