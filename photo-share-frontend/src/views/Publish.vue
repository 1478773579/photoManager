<template>
  <div class="publish-container">
    <van-nav-bar
      title="发布作品"
      left-arrow
      @click-left="$router.go(-1)"
      class="nav-bar"
    >
      <template #right>
        <van-button 
          type="primary" 
          size="small" 
          @click="handlePublish"
          :loading="publishing"
          :disabled="!canPublish"
        >
          发布
        </van-button>
      </template>
    </van-nav-bar>

    <div class="content">
      <!-- 图片上传区域 -->
      <div class="upload-section">
        <van-uploader
          v-model="fileList"
          :after-read="afterRead"
          :before-delete="beforeDelete"
          :max-count="9"
          :max-size="10 * 1024 * 1024"
          preview-size="100px"
          multiple
          class="uploader"
        />
        <div class="upload-tip">
          最多上传9张图片，单张不超过10MB
        </div>
      </div>

      <!-- 作品信息 -->
      <van-form class="publish-form">
        <van-field
          v-model="form.title"
          label="标题"
          placeholder="给作品起个标题吧"
          maxlength="50"
          show-word-limit
        />
        
        <van-field
          v-model="form.description"
          type="textarea"
          label="描述"
          placeholder="分享你的创作心得..."
          maxlength="500"
          show-word-limit
          autosize
        />

        <!-- 标签选择 -->
        <van-field label="标签" readonly>
          <template #input>
            <div class="tags-container">
              <van-tag
                v-for="tag in selectedTags"
                :key="tag"
                closeable
                @close="removeTag(tag)"
                class="tag-item"
              >
                {{ tag }}
              </van-tag>
              <van-button
                size="small"
                type="primary"
                plain
                @click="showTagSelector = true"
                class="add-tag-btn"
              >
                添加标签
              </van-button>
            </div>
          </template>
        </van-field>

        <!-- 发布设置 -->
        <van-cell-group title="发布设置">
          <van-cell title="允许评论" is-link>
            <template #right-icon>
              <van-switch v-model="form.allowComments" />
            </template>
          </van-cell>
          <van-cell title="允许下载" is-link>
            <template #right-icon>
              <van-switch v-model="form.allowDownload" />
            </template>
          </van-cell>
        </van-cell-group>
      </van-form>
    </div>

    <!-- 标签选择器 -->
    <van-popup v-model:show="showTagSelector" position="bottom" :style="{ height: '60%' }">
      <div class="tag-selector">
        <div class="tag-selector-header">
          <van-button @click="showTagSelector = false">取消</van-button>
          <span class="title">选择标签</span>
          <van-button type="primary" @click="confirmTags">确定</van-button>
        </div>
        
        <div class="tag-search">
          <van-search
            v-model="tagSearchKeyword"
            placeholder="搜索标签"
            @search="searchTags"
          />
        </div>

        <div class="tag-list">
          <van-tag
            v-for="tag in filteredTags"
            :key="tag"
            :type="tempSelectedTags.includes(tag) ? 'primary' : 'default'"
            @click="toggleTag(tag)"
            class="tag-option"
          >
            {{ tag }}
          </van-tag>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import request from '@/utils/request'

const router = useRouter()

const fileList = ref([])
const publishing = ref(false)
const showTagSelector = ref(false)
const tagSearchKeyword = ref('')

const form = ref({
  title: '',
  description: '',
  allowComments: true,
  allowDownload: false
})

const selectedTags = ref([])
const tempSelectedTags = ref([])

// 可选标签列表
const availableTags = [
  '风景', '人像', '街拍', '美食', '旅行', '建筑', '动物', '植物',
  '黑白', '夜景', '日出', '日落', '山川', '海洋', '城市', '乡村',
  '艺术', '创意', '纪实', '运动', '宠物', '花卉', '微距', '全景'
]

// 过滤后的标签
const filteredTags = computed(() => {
  if (!tagSearchKeyword.value) {
    return availableTags
  }
  return availableTags.filter(tag => 
    tag.includes(tagSearchKeyword.value)
  )
})

// 是否可以发布
const canPublish = computed(() => {
  return fileList.value.length > 0 && form.value.title.trim()
})

// 文件读取完成
const afterRead = async (file) => {
  // 这里只是将文件添加到fileList，不立即上传
  // 上传操作将在点击发布按钮时统一处理
  file.uploaded = false
}

// 将dataURL转换为Blob
const dataURLtoBlob = (dataURL) => {
  const arr = dataURL.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

// 删除文件前确认
const beforeDelete = (file, detail) => {
  return true
}

// 搜索标签
const searchTags = (keyword) => {
  // 搜索逻辑已在computed中实现
}

// 切换标签选择
const toggleTag = (tag) => {
  const index = tempSelectedTags.value.indexOf(tag)
  if (index > -1) {
    tempSelectedTags.value.splice(index, 1)
  } else {
    if (tempSelectedTags.value.length < 5) {
      tempSelectedTags.value.push(tag)
    } else {
      showToast('最多选择5个标签')
    }
  }
}

// 移除标签
const removeTag = (tag) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  }
}

// 确认标签选择
const confirmTags = () => {
  selectedTags.value = [...tempSelectedTags.value]
  showTagSelector.value = false
}

// 处理发布
const handlePublish = async () => {
  if (!canPublish.value) {
    showToast('请完善发布信息')
    return
  }

  publishing.value = true

  try {
    // 确保选择了图片
    if (fileList.value.length === 0) {
      showToast('请先选择图片')
      publishing.value = false
      return
    }

    // 创建FormData用于批量上传
    const formData = new FormData()
    
    // 添加所有选择的图片
    fileList.value.forEach(file => {
      if (file.file) {
        formData.append('photos', file.file)
      } else if (file.content) {
        // 将base64转换为blob
        const blob = dataURLtoBlob(file.content)
        const fileName = `image_${Date.now()}.jpg`
        formData.append('photos', blob, fileName)
      }
    })
    
    // 准备照片数据（每张照片的元数据）
    const photosData = fileList.value.map(() => ({
      title: form.value.title,
      description: form.value.description,
      tags: selectedTags.value,
      settings: {
        allowComments: form.value.allowComments,
        allowDownload: form.value.allowDownload
      }
    }))
    
    // 添加照片数据到FormData
    formData.append('photosData', JSON.stringify(photosData))
    
    // 使用批量上传接口上传所有图片并创建记录
    const response = await request.post('/photos/upload-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    if (response.data.success) {
      showSuccessToast('发布成功')
      router.push('/home')
    } else {
      showToast('发布失败')
    }
  } catch (error) {
    console.error('发布失败:', error)
    showToast('发布失败，请重试')
  } finally {
    publishing.value = false
  }
}
</script>

<style scoped>
.publish-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.nav-bar {
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.content {
  padding: 16px;
}

.upload-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.uploader {
  margin-bottom: 12px;
}

.upload-tip {
  font-size: 12px;
  color: #999;
  text-align: center;
}

.publish-form {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.tag-item {
  margin: 0;
}

.add-tag-btn {
  height: 24px;
  padding: 0 8px;
}

.tag-selector {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tag-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.tag-selector-header .title {
  font-weight: 500;
}

.tag-search {
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.tag-list {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.tag-option {
  margin: 4px;
  cursor: pointer;
}
</style>