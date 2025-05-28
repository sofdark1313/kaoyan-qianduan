<template>
  <div class="chat-container">
    <el-container class="chat-layout">
      <el-header class="chat-header">
        <div class="user-info">
          <el-avatar :size="36" :icon="UserFilled" class="avatar" />
          <div class="user-details">
            <span class="username">{{ accountName }}</span>
            <span class="user-type">{{ accountIdentity }}</span>
          </div>
        </div>
        <div class="header-actions">
          <el-dropdown @command="handleCommand" trigger="click">
            <el-button type="text" class="menu-btn">
              <el-icon><Setting /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="changePassword">
                  <el-icon><Lock /></el-icon>
                  修改密码
                </el-dropdown-item>
                <el-dropdown-item command="deactivate" divided>
                  <el-icon><Delete /></el-icon>
                  注销账号
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="chat-main">
        <div class="messages" ref="messagesRef">
          <template v-if="messages.length === 0">
            <div class="welcome-message">
              <img src="../assets/logo.ico" alt="Logo" class="welcome-logo" />
              <h2>欢迎使用 AI 学业助手</h2>
              <p>我可以帮助你在学业上的选择，请把你的任务交给我吧~</p>
            </div>
          </template>
          <template v-else>
            <div v-for="(message, index) in messages" 
                 :key="index" 
                 :class="['message', message.role === 'user' ? 'message-user' : 'message-ai']">
              <div class="message-avatar">
                <el-avatar :size="36" :icon="message.role === 'user' ? UserFilled : Monitor" />
              </div>
              <div class="message-content">
                <div class="message-text">{{ message.content }}</div>
                <div class="message-time">{{ formatTime(message.timestamp || Date.now()) }}</div>
              </div>
            </div>
          </template>
        </div>
      </el-main>
      
      <el-footer class="chat-footer">
        <div class="input-wrapper">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="3"
            placeholder="输入消息..."
            resize="none"
            @keydown.enter.exact.prevent="sendMessage"
          />
          <el-button 
            type="primary" 
            :loading="loading" 
            @click="sendMessage"
            class="send-btn"
          >
            发送
          </el-button>
        </div>
      </el-footer>
    </el-container>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="passwordDialog"
      title="修改密码"
      width="400px"
      center
      destroy-on-close
    >
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef">
        <el-form-item prop="oldPassword" label="原密码">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            show-password
          />
        </el-form-item>
        <el-form-item prop="newPassword" label="新密码">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialog = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleChangePassword"
          :loading="passwordLoading"
        >
          确认
        </el-button>
      </template>
    </el-dialog>

    <!-- 注销账号确认对话框 -->
    <el-dialog
      v-model="deactivateDialog"
      title="注销账号"
      width="400px"
      center
      destroy-on-close
    >
      <div class="deactivate-warning">
        <el-icon class="warning-icon"><Warning /></el-icon>
        <p>确定要注销账号吗？此操作不可恢复！</p>
      </div>
      <template #footer>
        <el-button @click="deactivateDialog = false">取消</el-button>
        <el-button
          type="danger"
          @click="handleDeactivate"
          :loading="deactivateLoading"
        >
          确认注销
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Setting, 
  UserFilled, 
  Lock, 
  Delete, 
  SwitchButton, 
  Warning,
  Monitor 
} from '@element-plus/icons-vue'
import { chatFinal, changePassword, deactivateAccount } from '@/api'

const router = useRouter()
const messagesRef = ref(null)
const loading = ref(false)
const inputMessage = ref('')
const messages = ref([])
const accountName = ref(localStorage.getItem('accountName') || '用户')
const accountIdentity = ref(localStorage.getItem('accountIdentity') || '普通用户')

// 密码修改相关
const passwordDialog = ref(false)
const passwordLoading = ref(false)
const passwordFormRef = ref(null)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: ''
})
const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ]
}

// 注销账号相关
const deactivateDialog = ref(false)
const deactivateLoading = ref(false)

// 在script setup部分添加
const messageCache = new Map()

// 修改sendMessage函数
const sendMessage = async () => {
  if (!inputMessage.value.trim()) return
  
  const userMessage = inputMessage.value.trim()
  messages.value.push({ 
    role: 'user', 
    content: userMessage,
    timestamp: Date.now()
  })
  inputMessage.value = ''
  
  loading.value = true
  try {
    // 构造消息历史数组
    const messageHistory = messages.value.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
    
    // 生成缓存键
    const cacheKey = JSON.stringify(messageHistory)
    
    // 检查缓存
    if (messageCache.has(cacheKey)) {
      const cachedResponse = messageCache.get(cacheKey)
      messages.value.push({ 
        role: 'assistant', 
        content: cachedResponse,
        timestamp: Date.now()
      })
    } else {
      const res = await chatFinal({ message: messageHistory })
      if (res.code === 200) {
        // 存入缓存
        messageCache.set(cacheKey, res.data)
        messages.value.push({ 
          role: 'assistant', 
          content: res.data,
          timestamp: Date.now()
        })
      } else {
        ElMessage.error(res.msg || '发送失败')
      }
    }
  } catch (error) {
    console.error('Chat error:', error)
    ElMessage.error('发送失败，请稍后重试')
  } finally {
    loading.value = false
    await nextTick()
    scrollToBottom()
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

// 处理下拉菜单命令
const handleCommand = (command) => {
  switch (command) {
    case 'changePassword':
      passwordDialog.value = true
      break
    case 'deactivate':
      deactivateDialog.value = true
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 修改密码
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return
  
  try {
    await passwordFormRef.value.validate()
    passwordLoading.value = true
    
    const res = await changePassword(passwordForm)
    if (res.code === 1) {
      ElMessage.success('密码修改成功')
      passwordDialog.value = false
      handleLogout()
    } else {
      ElMessage.error(res.msg || '密码修改失败')
    }
  } catch (error) {
    console.error('Change password error:', error)
    ElMessage.error('密码修改失败，请稍后重试')
  } finally {
    passwordLoading.value = false
  }
}

// 注销账号
const handleDeactivate = async () => {
  try {
    deactivateLoading.value = true
    const res = await deactivateAccount({ password: passwordForm.oldPassword })
    if (res.code === 1) {
      ElMessage.success('账号已注销')
      handleLogout()
    } else {
      ElMessage.error(res.msg || '注销失败')
    }
  } catch (error) {
    console.error('Deactivate account error:', error)
    ElMessage.error('注销失败，请稍后重试')
  } finally {
    deactivateLoading.value = false
    deactivateDialog.value = false
  }
}

// 退出登录
const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('accountId')
  localStorage.removeItem('accountName')
  localStorage.removeItem('accountIdentity')
  router.push('/login')
}

// 监听页面加载
onMounted(() => {
  scrollToBottom()
})
// 在script setup部分添加
const pageSize = 10
const displayedMessages = ref([])

// 初始化时只加载最近的消息
onMounted(() => {
  if (messages.value.length > pageSize) {
    displayedMessages.value = messages.value.slice(-pageSize)
  } else {
    displayedMessages.value = [...messages.value]
  }
})

// 添加加载更多消息的函数
const loadMoreMessages = () => {
  const currentSize = displayedMessages.value.length
  const newMessages = messages.value.slice(
    Math.max(0, currentSize - pageSize),
    currentSize
  )
  displayedMessages.value = [...newMessages, ...displayedMessages.value]
}
</script>

<style scoped>
.chat-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.chat-layout {
  height: 100%;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  height: auto;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 500;
  color: #333;
  font-size: 16px;
}

.user-type {
  font-size: 12px;
  color: #666;
}

.avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.menu-btn {
  font-size: 20px;
  color: #666;
  padding: 8px;
}

.chat-main {
  flex: 1;
  padding: 20px;
  overflow: hidden;
}

.messages {
  height: 100%;
  overflow-y: auto;
  padding-right: 10px;
  display: flex;
  flex-direction: column;
}

.welcome-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  text-align: center;
}

.welcome-logo {
  width: 80px;
  height: 80px;
  margin-bottom: 20px;
}

.message {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  width: 100%;
}

.message-user {
  justify-content: flex-end;
}

.message-ai {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
}

.message-avatar {
  display: flex;
  align-items: flex-start;
}

.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
}

.message-user .message-content {
  align-items: flex-end;
}

.message-ai .message-content {
  align-items: flex-start;
}

.message-user .message-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 12px 12px 0 12px;
}

.message-ai .message-text {
  background: #fff;
  color: #333;
  border-radius: 12px 12px 12px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.message-user .message-time {
  text-align: right;
}

.message-ai .message-time {
  text-align: left;
}

.message-ai .message-avatar :deep(.el-avatar) {
  background: linear-gradient(135deg, #00b8d4 0%, #0052cc 100%);
}

.message-user .message-avatar :deep(.el-avatar) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.chat-footer {
  background: #fff;
  padding: 16px 20px;
  height: auto;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.input-wrapper {
  display: flex;
  gap: 12px;
}

.input-wrapper :deep(.el-textarea__inner) {
  resize: none;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.send-btn {
  align-self: flex-end;
  height: 40px;
  padding: 0 24px;
  font-size: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;

  &:hover {
    background: linear-gradient(135deg, #5a6fd6 0%, #6a4494 100%);
  }

  &:active {
    background: linear-gradient(135deg, #4e62c2 0%, #5e3b86 100%);
  }
}

.deactivate-warning {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #f56c6c;
  padding: 16px;
  background: #fef0f0;
  border-radius: 8px;
}

.warning-icon {
  font-size: 24px;
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 响应式调整 */
@media screen and (max-width: 480px) {
  .chat-header {
    padding: 8px 16px;
  }

  .chat-main {
    padding: 16px;
  }

  .chat-footer {
    padding: 12px 16px;
  }

  .message-content {
    max-width: 85%;
  }

  .input-wrapper {
    gap: 8px;
  }

  .send-btn {
    padding: 0 16px;
  }
}
</style>