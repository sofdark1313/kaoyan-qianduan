<template>
  <div class="chat-container">
    <el-container class="chat-layout">
      <!-- 侧边栏 -->
      <el-aside class="chat-sidebar" :width="sidebarCollapsed ? '64px' : '280px'" :class="{ 'collapsed': sidebarCollapsed }">
        <div class="sidebar-header">
          <h3 v-if="!sidebarCollapsed" class="app-title">AI 助学</h3>
          <el-button 
  type="text" 
  @click="toggleSidebar"
  class="collapse-btn"
>
  <el-icon>
    <Menu />
  </el-icon>
</el-button>
          <el-button 
            v-if="!sidebarCollapsed"
            type="primary" 
            size="small" 
            @click="createNewDialog"
            class="new-dialog-btn"
          >
            <el-icon><Plus /></el-icon>
            新建对话
          </el-button>
        </div>
        <div class="dialog-list">
          <div 
            v-for="dialog in dialogList" 
            :key="dialog.dialogId"
            :class="['dialog-item', { active: currentDialogId === dialog.dialogId }]"
            @click="switchDialog(dialog.dialogId)"
          >
            <div class="dialog-info" :title="dialog.title || `对话 ${dialog.dialogId}`">
              <div class="dialog-title">
                <el-icon class="dialog-icon"><ChatLineRound /></el-icon>
                {{ sidebarCollapsed ? dialog.title?.charAt(0) || '#' : dialog.title || `对话 ${dialog.dialogId}` }}
              </div>
              <div v-if="!sidebarCollapsed" class="dialog-time">{{ formatDialogTime(dialog.lastMessageTime) }}</div>
            </div>
            <el-button 
              v-if="!sidebarCollapsed"
              type="text" 
              size="small" 
              @click.stop="deleteDialog(dialog.dialogId)"
              class="delete-btn"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </el-aside>

      <el-container class="main-chat">
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
                  <el-dropdown-item command="upgrade">
                    <el-icon><Opportunity /></el-icon>
                    升级VIP
                  </el-dropdown-item>
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
                
                <div class="question-grid">
                  <div 
                    v-for="(item, index) in quickQuestions" 
                    :key="index"
                    class="question-card"
                    @click="askQuickQuestion(item.question)"
                  >
                    {{ item.question }}
                  </div>
                </div>
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
      <el-form :model="deactivateForm" :rules="deactivateRules" ref="deactivateFormRef">
        <el-form-item prop="password" label="当前密码">
          <el-input
            v-model="deactivateForm.password"
            type="password"
            show-password
            placeholder="请输入当前密码以确认注销"
          />
        </el-form-item>
      </el-form>
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
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Setting, 
  UserFilled, 
  Lock, 
  Delete, 
  SwitchButton, 
  Warning,
  Monitor,
  QuestionFilled,
  School,
  Collection,
  Switch,
  Opportunity,
  Plus,
  Expand,
  Fold,
  ChatLineRound,
  Menu
} from '@element-plus/icons-vue'
import { 
  chatFinal, 
  changePassword, 
  deactivateAccount, 
  getChatHistory, 
  saveChatHistory, 
  deleteChatHistory,
  getAccountInfo  // 新增API导入
} from '@/api'

const router = useRouter()
const messagesRef = ref(null)
const loading = ref(false)
const inputMessage = ref('')
const messages = ref([])
const accountName = ref('用户')
const accountIdentity = ref('普通用户')
const accountId = ref(parseInt(localStorage.getItem('accountId')) || 10001)

// 新增获取账户信息的方法
const fetchAccountInfo = async () => {
  try {
    const res = await getAccountInfo(accountId.value)
    if (res.code === 1 && res.data) {
      accountName.value = res.data.accountName || '用户'
      accountIdentity.value = res.data.accountIdentity || '普通用户'
      // 可选：保存到localStorage
      localStorage.setItem('accountName', accountName.value)
      localStorage.setItem('accountIdentity', accountIdentity.value)
    }
  } catch (error) {
    console.error('获取账户信息失败:', error)
  }
}

// 对话管理相关
const dialogList = ref([])
const currentDialogId = ref(null)
const nextDialogId = ref(1)

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
const deactivateFormRef = ref(null)
const deactivateForm = reactive({
  password: ''
})
const deactivateRules = {
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

// 在script setup部分添加
const messageCache = new Map()

// 添加快速问题列表
const quickQuestions = [
  {
    title: "选校指南",
    question: "我的分数适合报考哪些学校？",
    icon: "School"
  },
  {
    title: "专业选择",
    question: "如何选择适合自己的院校和专业？",
    icon: "Collection"
  },
  {
    title: "调剂指导",
    question: "考研调剂需要注意什么？",
    icon: "Switch"
  },
  {
    title: "就业前景",
    question: "如何评估学校的就业前景？",
    icon: "Opportunity"
  }
]

// 处理快速问题点击
const askQuickQuestion = (question) => {
  inputMessage.value = question
  sendMessage()
}

// 修改sendMessage函数，添加保存聊天记录功能
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
        return
      }
    }
    
    // 保存聊天记录到数据库
    await saveChatHistoryToDb()
    
  } catch (error) {
    console.error('Chat error:', error)
    ElMessage.error('发送失败，请稍后重试')
  } finally {
    loading.value = false
    await nextTick()
    scrollToBottom()
  }
}

// 保存聊天记录到数据库
const saveChatHistoryToDb = async () => {
  if (!currentDialogId.value || messages.value.length === 0) return
  
  try {
    const conversation = messages.value.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp
    }))
    
    await saveChatHistory({
      accountId: accountId.value,
      dialogId: currentDialogId.value,
      conversation
    })
    
    // 更新对话列表中的最后消息时间
    const dialog = dialogList.value.find(d => d.dialogId === currentDialogId.value)
    if (dialog) {
      dialog.lastMessageTime = Date.now()
      saveDialogList() // 保存对话列表到本地存储
    }
  } catch (error) {
    console.error('Save chat history error:', error)
  }
}

// 保存对话列表到本地存储
const isCollapse = ref(false)
const sidebarCollapsed = ref(false)

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const saveDialogList = () => {
  const key = `dialogList_${accountId.value}`
  localStorage.setItem(key, JSON.stringify(dialogList.value))
}

// 加载聊天记录
const loadChatHistory = async (dialogId) => {
  try {
    const res = await getChatHistory({
      accountId: accountId.value,
      dialogId
    })
    if (res.code === 1 && res.data && res.data.conversation) {
      messages.value = res.data.conversation.map(msg => ({
        ...msg,
        timestamp: msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now()
      }))
    } else {
      messages.value = []
    }
  } catch (error) {
    console.error('Load chat history error:', error)
    messages.value = []
  }
}

// 创建新对话
const createNewDialog = () => {
  const newDialogId = nextDialogId.value++
  const newDialog = {
    dialogId: newDialogId,
    title: `对话 ${newDialogId}`,
    lastMessageTime: Date.now()
  }
  
  dialogList.value.unshift(newDialog)
  saveDialogList() // 保存对话列表
  switchDialog(newDialogId)
}

// 切换对话
const switchDialog = async (dialogId) => {
  if (currentDialogId.value === dialogId) return
  
  currentDialogId.value = dialogId
  await loadChatHistory(dialogId)
  await nextTick()
  scrollToBottom()
}

// 删除对话
const deleteDialog = async (dialogId) => {
  try {
    await ElMessageBox.confirm('确定要删除这个对话吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 从数据库删除
    await deleteChatHistory(accountId.value, dialogId)
    
    // 从列表中移除
    const index = dialogList.value.findIndex(d => d.dialogId === dialogId)
    if (index > -1) {
      dialogList.value.splice(index, 1)
      saveDialogList() // 保存对话列表
    }
    
    // 如果删除的是当前对话，切换到第一个对话或创建新对话
    if (currentDialogId.value === dialogId) {
      if (dialogList.value.length > 0) {
        switchDialog(dialogList.value[0].dialogId)
      } else {
        createNewDialog()
      }
    }
    
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete dialog error:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 格式化对话时间
const formatDialogTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 24 * 60 * 60 * 1000) {
    // 今天
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (diff < 7 * 24 * 60 * 60 * 1000) {
    // 一周内
    const days = ['日', '一', '二', '三', '四', '五', '六']
    return `周${days[date.getDay()]}`
  } else {
    // 更早
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
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
    case 'upgrade':
      router.push('/upgrade')
      break
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
  if (!deactivateFormRef.value) return
  
  try {
    await deactivateFormRef.value.validate()
    deactivateLoading.value = true
    
    const res = await deactivateAccount({ 
      password: deactivateForm.password 
    })
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

// 在script setup部分添加
const pageSize = 10
const displayedMessages = ref([])

// 添加加载更多消息的函数
const loadMoreMessages = () => {
  const currentSize = displayedMessages.value.length
  const newMessages = messages.value.slice(
    Math.max(0, currentSize - pageSize),
    currentSize
  )
  displayedMessages.value = [...newMessages, ...displayedMessages.value]
}

// 初始化
onMounted(async () => {
  try {
    await fetchAccountInfo()
    // 获取当前用户的对话列表
    const key = `dialogList_${accountId.value}`
    const savedDialogs = localStorage.getItem(key)
    if (savedDialogs) {
      dialogList.value = JSON.parse(savedDialogs)
      nextDialogId.value = Math.max(...dialogList.value.map(d => d.dialogId)) + 1
    }
    
    // 如果没有对话，创建一个新对话
    if (dialogList.value.length === 0) {
      createNewDialog()
    } else {
      // 默认打开第一个对话
      switchDialog(dialogList.value[0].dialogId)
    }
    
    // 初始化时只加载最近的消息
    if (messages.value.length > pageSize) {
      displayedMessages.value = messages.value.slice(-pageSize)
    } else {
      displayedMessages.value = [...messages.value]
    }
    
    scrollToBottom()
  } catch (error) {
    console.error('Init error:', error)
    // 出错时创建新对话
    createNewDialog()
  }
})
</script>

<style scoped>
.chat-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #f8f9fd;
  display: flex;
  flex-direction: column;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.chat-layout {
  height: 100vh;
}

.chat-sidebar {
  background: #f5f7fa;
  border-right: 1px solid #e6e6e6;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-sidebar.collapsed {
  padding: 8px;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.app-title {
  margin: 0;
  font-size: 18px;
  color: #333;
  flex: 1;
}

.collapse-btn {
  padding: 8px;
  margin: 0 10px;
  color: #606266;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s;
}
.collapse-btn:hover {
  color: #409eff;
}

.new-dialog-btn {
  margin-left: 8px;
  border-radius: 6px;
}

.dialog-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.dialog-item {
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;
}

.dialog-item:hover {
  background: #ecf5ff;
}

.dialog-item.active {
  background: #409eff;
  color: white;
}

.dialog-item.active .dialog-time,
.dialog-item.active .delete-btn {
  color: #fff;
}

.dialog-info {
  flex: 1;
  overflow: hidden;
}

.dialog-title {
  font-size: 14px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dialog-icon {
  font-size: 16px;
}

.dialog-time {
  font-size: 12px;
  color: #909399;
}

.delete-btn {
  opacity: 0;
  color: #909399;
  transition: opacity 0.2s ease;
}

.dialog-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: #f56c6c;
}

.main-chat {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  height: auto;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 14px;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.user-type {
  font-size: 12px;
  color: #666;
  background-color: #f0f2ff;
  padding: 2px 8px;
  border-radius: 10px;
  margin-top: 4px;
  display: inline-block;
}

.avatar {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  box-shadow: 0 4px 8px rgba(99, 102, 241, 0.2);
  transition: transform 0.3s ease;
}

.avatar:hover {
  transform: scale(1.05);
}

.menu-btn {
  font-size: 20px;
  color: #666;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.menu-btn:hover {
  background-color: #f0f2ff;
  color: #6366f1;
}

.chat-main {
  flex: 1;
  padding: 24px;
  overflow: hidden;
  background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmMGYyZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00bTAgLTEyYzAtMi4yIDEuOC00IDQtNHM0IDEuOCA0IDQtMS44IDQtNCA0LTQtMS44LTQtNG0tMTIgMGMwLTIuMiAxLjgtNCA0LTRzNCAxLjggNCA0LTEuOCA0LTQgNC00LTEuOC00LTRtLTEyIDBjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00bS0xMiAwYzAtMi4yIDEuOC00IDQtNHM0IDEuOCA0IDQtMS44IDQtNCA0LTQtMS44LTQtNG0wIDEyYzAtMi4yIDEuOC00IDQtNHM0IDEuOCA0IDQtMS44IDQtNCA0LTQtMS44LTQtNFoiLz48L2c+PC9nPjwvc3ZnPg==');
  background-repeat: repeat;
  background-size: 60px 60px;
}

.messages {
  height: 100%;
  overflow-y: auto;
  padding-right: 10px;
  display: flex;
  flex-direction: column;
  scroll-behavior: smooth;
}

.messages::-webkit-scrollbar {
  width: 6px;
}

.messages::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 3px;
}

.messages::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.messages::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

.welcome-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  text-align: center;
  padding: 40px 20px;
}

.welcome-logo {
  width: 100px;
  height: 100px;
  margin-bottom: 24px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

.welcome-message h2 {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.welcome-message p {
  font-size: 16px;
  line-height: 1.6;
  color: #666;
  margin-bottom: 40px;
}

.question-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.question-card {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  animation: floatIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes floatIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.question-card:nth-child(1) { animation-delay: 0.1s; }
.question-card:nth-child(2) { animation-delay: 0.2s; }
.question-card:nth-child(3) { animation-delay: 0.3s; }
.question-card:nth-child(4) { animation-delay: 0.4s; }

.question-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.3);
  box-shadow: 0 15px 40px rgba(99, 102, 241, 0.2);
  border-color: rgba(99, 102, 241, 0.3);
  color: #6366f1;
}

@media screen and (max-width: 768px) {
  .welcome-message {
    padding: 30px 16px;
  }

  .welcome-logo {
    width: 80px;
    height: 80px;
    margin-bottom: 20px;
  }

  .welcome-message h2 {
    font-size: 24px;
  }

  .welcome-message p {
    font-size: 15px;
    margin-bottom: 30px;
  }

  .question-grid {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 0 16px;
  }

  .question-card {
    padding: 20px;
    font-size: 14px;
  }
}

.message {
  display: flex;
  gap: 14px;
  margin-bottom: 28px;
  width: 100%;
  animation: messageIn 0.3s ease-out;
}

@keyframes messageIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
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

.message-avatar :deep(.el-avatar) {
  transition: transform 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.message-avatar :deep(.el-avatar):hover {
  transform: scale(1.05);
}

.message-text {
  padding: 14px 18px;
  border-radius: 16px;
  font-size: 15px;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.message-user .message-content {
  align-items: flex-end;
}

.message-ai .message-content {
  align-items: flex-start;
}

.message-user .message-text {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  border-radius: 16px 16px 0 16px;
}

.message-user .message-text:hover {
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.2);
  transform: translateY(-2px);
}

.message-ai .message-text {
  background: #fff;
  color: #333;
  border-radius: 16px 16px 16px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.message-ai .message-text:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 6px;
}

.message-user .message-time {
  text-align: right;
}

.message-ai .message-time {
  text-align: left;
}

.message-ai .message-avatar :deep(.el-avatar) {
  background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
}

.message-user .message-avatar :deep(.el-avatar) {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
}

.chat-footer {
  background: #fff;
  padding: 20px 24px;
  height: auto;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.input-wrapper {
  display: flex;
  gap: 14px;
}

.input-wrapper :deep(.el-textarea__inner) {
  resize: none;
  border-radius: 12px;
  padding: 14px;
  font-size: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.input-wrapper :deep(.el-textarea__inner:focus) {
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.3);
}

.send-btn {
  align-self: flex-end;
  height: 46px;
  padding: 0 28px;
  font-size: 15px;
  font-weight: 500;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
  transition: all 0.3s ease;
}

.send-btn:hover {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.3);
  transform: translateY(-2px);
}

.send-btn:active {
  background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
  transform: translateY(0);
}

.deactivate-warning {
  display: flex;
  align-items: center;
  gap: 14px;
  color: #ef4444;
  padding: 18px;
  background: #fef2f2;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.warning-icon {
  font-size: 28px;
  color: #ef4444;
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  transition: all 0.3s ease;
}

:deep(.el-dropdown-menu__item:hover) {
  background-color: #f0f2ff;
  color: #6366f1;
}

:deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

:deep(.el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  margin-right: 0;
}

:deep(.el-dialog__title) {
  font-weight: 600;
  font-size: 18px;
  color: #333;
}

:deep(.el-dialog__body) {
  padding: 24px;
}

:deep(.el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #333;
}

:deep(.el-input__inner) {
  border-radius: 8px;
  padding: 12px;
  transition: all 0.3s ease;
}

:deep(.el-input__inner:focus) {
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
  border-color: #6366f1;
}

:deep(.el-button) {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.3);
  transform: translateY(-2px);
}

:deep(.el-button--danger) {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}

:deep(.el-button--danger:hover) {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.3);
  transform: translateY(-2px);
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .chat-header {
    padding: 12px 20px;
  }

  .chat-main {
    padding: 20px;
  }

  .chat-footer {
    padding: 16px 20px;
  }

  .message-content {
    max-width: 80%;
  }
}

@media screen and (max-width: 480px) {
  .chat-header {
    padding: 10px 16px;
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
    gap: 10px;
  }

  .send-btn {
    padding: 0 20px;
    height: 42px;
  }

  .welcome-message {
    padding: 30px 20px;
  }

  .welcome-logo {
    width: 80px;
    height: 80px;
  }

  .welcome-message h2 {
    font-size: 20px;
  }

  .welcome-message p {
    font-size: 14px;
  }
}
</style>

/* 考研问题卡片样式 */
.quick-questions {
  margin-top: 40px;
  width: 100%;
  max-width: 1000px;
  padding: 0 20px;
}

.floating-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
  padding: 32px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(99, 102, 241, 0.1);
  animation: floatIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes floatIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.floating-card h3 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 24px;
  text-align: center;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.question-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.question-card {
  background: #fff;
  padding: 24px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  border: 1px solid rgba(99, 102, 241, 0.1);
  position: relative;
  overflow: hidden;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.8));
}

.question-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.question-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.3);
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9));
}

.question-card:hover::before {
  opacity: 1;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f0f2ff 0%, #e6e9ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.question-card:hover .card-icon {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  transform: scale(1.05);
}

.card-icon .el-icon {
  font-size: 24px;
  color: #6366f1;
  transition: all 0.3s ease;
}

.question-card:hover .card-icon .el-icon {
  color: #fff;
}

.question-card h4 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
  transition: color 0.3s ease;
}

.question-card:hover h4 {
  color: #6366f1;
}

.question-card p {
  font-size: 14px;
  line-height: 1.6;
  color: #666;
  margin: 0;
}

@media screen and (max-width: 768px) {
  .quick-questions {
    padding: 0 16px;
  }

  .floating-card {
    padding: 24px;
    border-radius: 20px;
  }

  .floating-card h3 {
    font-size: 20px;
    margin-bottom: 20px;
  }

  .question-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .question-card {
    padding: 20px;
  }
  
  .card-icon {
    width: 40px;
    height: 40px;
  }
  
  .card-icon .el-icon {
    font-size: 20px;
  }
  
  .question-card h4 {
    font-size: 16px;
  }
}
