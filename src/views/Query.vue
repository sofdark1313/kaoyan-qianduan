<template>
  <div class="query-container">
    <el-container class="query-layout">
      <el-header class="query-header">
        <div class="header-left">
          <el-button type="text" @click="goBack" class="back-btn">
            <el-icon><ArrowLeft /></el-icon>
            返回聊天
          </el-button>
          <h2 class="page-title">查询助手</h2>
        </div>
        <div class="user-info">
          <span class="username">{{ accountName }}</span>
          <el-avatar :size="40" :icon="UserFilled" class="avatar" />
        </div>
      </el-header>
      
      <el-main class="query-main">
        <div class="messages" ref="messagesRef">
          <template v-if="messages.length === 0">
            <div class="welcome-message">
              <div class="welcome-icon">
                <el-icon><Monitor /></el-icon>
              </div>
              <h2>欢迎使用 AI 智能助手</h2>
              <p>您可以向我提问任何问题，我将尽力为您解答</p>
              <!-- 移除悬浮卡片 -->
            </div>
          </template>
          <template v-else>
            <div v-for="(message, index) in messages" 
                 :key="index" 
                 :class="['message', message.role === 'user' ? 'message-user' : 'message-ai']">
              <div class="message-avatar">
                <el-avatar 
                  :size="40" 
                  :icon="message.role === 'user' ? UserFilled : Monitor" 
                  :class="message.role === 'user' ? 'user-avatar' : 'ai-avatar'"
                />
              </div>
              <div class="message-content">
                <div class="message-text" :class="{'error-message': message.isError}" v-html="message.content"></div>
                <div class="message-time">{{ formatTime(message.timestamp || Date.now()) }}</div>
              </div>
            </div>
          </template>
        </div>
      </el-main>
      
      <el-footer class="query-footer">
        <div class="input-wrapper">
          <el-input
            v-model="queryForm.message"
            type="textarea"
            :rows="3"
            placeholder="输入您的问题..."
            resize="none"
            @keydown.enter.exact.prevent="submitQuery"
            class="message-input"
          />
          <el-button 
            type="primary" 
            :loading="loading" 
            @click="submitQuery"
            class="send-btn"
            :disabled="!queryForm.message.trim()"
          >
            <el-icon><Position /></el-icon>
            发送
          </el-button>
        </div>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { UserFilled, ArrowLeft, Position, Monitor } from '@element-plus/icons-vue'
import { chatQuery } from '../api/index'

const router = useRouter()
const accountName = ref('')
const loading = ref(false)
const response = ref(null)
const messages = ref([])
const messagesRef = ref(null)

const queryForm = ref({
  message: ''
})

// 返回聊天页面
const goBack = () => {
  router.push('/chat')
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
    setTimeout(() => {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }, 100)
  }
}

// 使用示例问题
const useExample = (example) => {
  queryForm.value.message = example
  submitQuery()
}

// 提交查询
const submitQuery = async () => {
  if (!queryForm.value.message.trim()) {
    ElMessage.warning('请输入查询内容')
    return
  }
  
  // 添加用户消息
  const userMessage = {
    role: 'user',
    content: queryForm.value.message,
    timestamp: Date.now()
  }
  messages.value.push(userMessage)
  scrollToBottom()
  
  const userInput = queryForm.value.message
  queryForm.value.message = ''
  
  loading.value = true
  try {
    const requestData = {
      message: [
        {
          role: 'user',
          content: userInput
        }
      ]
    }
    
    const result = await chatQuery(requestData)
    
    // 只显示result1中的data字段
    const responseContent = result.data?.result1?.data || result.data?.result1 || result.data
    response.value = responseContent
    
    // 格式化大学数据
    let formattedContent = '';
    if (Array.isArray(responseContent) && responseContent.length > 0 && responseContent[0]['大学名称']) {
      formattedContent = formatUniversityData(responseContent);
    } else {
      formattedContent = typeof responseContent === 'string' ? responseContent : JSON.stringify(responseContent, null, 2);
    }
    
    // 添加AI回复消息
    const aiMessage = {
      role: 'assistant',
      content: formattedContent,
      timestamp: Date.now()
    }
    messages.value.push(aiMessage)
    scrollToBottom()
    
  } catch (error) {
    console.error('查询失败:', error)
    ElMessage.error('查询失败: ' + (error.response?.data?.msg || error.message || '未知错误'))
    
    // 添加错误消息
    const errorMessage = {
      role: 'assistant',
      content: '查询失败: ' + (error.response?.data?.msg || error.message || '未知错误'),
      timestamp: Date.now(),
      isError: true
    }
    messages.value.push(errorMessage)
    scrollToBottom()
  } finally {
    loading.value = false
  }
}

// 格式化大学数据为HTML表格
const formatUniversityData = (universities) => {
  if (!Array.isArray(universities) || universities.length === 0) {
    return '没有找到大学数据';
  }
  
  // 获取所有字段名
  const fields = Object.keys(universities[0]);
  
  // 表头
  let headerRow = '';
  fields.forEach(field => {
    headerRow += `<th>${field}</th>`;
  });
  
  // 表格内容
  let rows = '';
  universities.forEach((uni, index) => {
    rows += '<tr>';
    
    fields.forEach(field => {
      let value = uni[field];
      
      // 格式化布尔值和特殊字段
      if (typeof value === 'boolean') {
        value = value ? 
          '<span class="true-value">✓</span>' : 
          '<span class="false-value">✗</span>';
      } else if (field === '公办/民办') {
        value = value === '1' ? '公办' : '民办';
      } else if (value === null || value === undefined) {
        value = '-';
      }
      
      rows += `<td>${value}</td>`;
    });
    
    rows += '</tr>';
  });
  
  // 组合表格
  return `<div style="overflow-x: auto; margin: 10px 0;">
  <table>
    <thead>
      <tr class="table-header">
        ${headerRow}
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  <div style="font-size: 13px; color: #6b7280; margin-top: 8px; text-align: right;">共 ${universities.length} 所大学</div>
</div>`;
};

// 获取用户信息
onMounted(() => {
  accountName.value = localStorage.getItem('accountName') || '用户'
})
</script>

<style scoped>
.query-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #f5f7fa;
  background-image: linear-gradient(135deg, #f5f7fa 0%, #e4edf9 100%);
  display: flex;
  flex-direction: column;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.query-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.query-header {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 70px;
  border-bottom: 1px solid rgba(230, 230, 230, 0.5);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
  transition: all 0.3s ease;
}

.back-btn:hover {
  color: #409eff;
  transform: translateX(-2px);
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.username {
  font-size: 15px;
  color: #606266;
  font-weight: 500;
}

.avatar {
  background: linear-gradient(135deg, #409eff 0%, #7e57c2 100%);
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.query-main {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background-color: transparent;
  scroll-behavior: smooth;
}

.messages {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 16px;
}

.welcome-message {
  text-align: center;
  padding: 40px 30px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  margin: 40px auto;
  max-width: 600px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  transition: all 0.5s ease;
  animation: floatIn 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes floatIn {
  0% { opacity: 0; transform: translateY(30px); }
  100% { opacity: 1; transform: translateY(0); }
}

.welcome-message:hover {
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.12);
  transform: translateY(-5px);
}

.welcome-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.welcome-icon :deep(svg) {
  width: 40px;
  height: 40px;
  color: white;
}

.welcome-message h2 {
  font-size: 28px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 16px;
}

.welcome-message p {
  font-size: 16px;
  color: #606266;
  margin-bottom: 30px;
  line-height: 1.6;
}

.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
}

.suggestion-chip {
  background: rgba(64, 158, 255, 0.1);
  border: 1px solid rgba(64, 158, 255, 0.2);
  color: #409eff;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.suggestion-chip:hover {
  background: rgba(64, 158, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.15);
}

.message {
  display: flex;
  margin-bottom: 24px;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-user {
  flex-direction: row-reverse;
}

.message-avatar {
  margin: 0 12px;
}

.user-avatar {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.ai-avatar {
  background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.message-content {
  max-width: 70%;
  padding: 16px 20px;
  border-radius: 16px;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.message-content:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.message-user .message-content {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-top-right-radius: 4px;
  color: #fff;
}

.message-user .message-content::before {
  content: '';
  position: absolute;
  top: 0;
  right: -10px;
  width: 0;
  height: 0;
  border-left: 10px solid #6366f1;
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  transform: rotate(45deg);
}

.message-ai .message-content {
  background: white;
  border: none;
  border-top-left-radius: 4px;
}

.message-ai .message-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: -10px;
  width: 0;
  height: 0;
  border-right: 10px solid white;
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  transform: rotate(-45deg);
}

.message-text {
  font-size: 15px;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap;
  color: #303133;
}

.message-text :deep(table) {
  width: 100%;
  border-collapse: collapse;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.message-text :deep(th) {
  padding: 12px 15px;
  text-align: left;
  font-weight: 600;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
}

.message-text :deep(td) {
  padding: 12px 15px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.message-text :deep(tbody tr:nth-child(odd)) {
  background-color: rgba(255, 255, 255, 0.8);
}

.message-text :deep(tbody tr:nth-child(even)) {
  background-color: rgba(243, 244, 246, 0.8);
}

.message-text :deep(.true-value) {
  color: #10b981;
  font-weight: 900;
}

.message-text :deep(.false-value) {
  color: #ef4444;
  font-weight: 900;
}

.message-user .message-text {
  color: #fff;
}

.error-message {
  color: #f56c6c;
}

.message-time {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
  text-align: right;
}

.query-footer {
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-top: 1px solid rgba(230, 230, 230, 0.5);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
  z-index: 10;
  position: relative;
  bottom: 0;
  height: auto;
  min-height: 100px;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  max-width: 1200;
  margin: 0 auto;
}

.message-input {
  flex: 1;
}

.message-input :deep(.el-textarea__inner) {
  border: 1px solid rgba(220, 223, 230, 0.6);
  border-radius: 12px;
  transition: all 0.3s;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 15px;
  padding: 16px;
  resize: none;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  height: auto;
  min-height: 80px;
}

.message-input :deep(.el-textarea__inner:focus) {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
  background: white;
}

.send-btn {
  height: 48px;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 12px;
  transition: all 0.3s ease;
  padding: 0 24px;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.send-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #818cf8 0%, #a78bfa 100%);
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.3);
}

.send-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .query-header {
    padding: 0 16px;
    height: 60px;
  }
  
  .page-title {
    font-size: 18px;
  }
  
  .query-main {
    padding: 16px;
  }
  
  .message-content {
    max-width: 85%;
    padding: 12px 16px;
  }
  
  .welcome-message {
    padding: 30px 20px;
  }
  
  .welcome-icon {
    width: 60px;
    height: 60px;
  }
  
  .welcome-icon :deep(svg) {
    width: 30px;
    height: 30px;
  }
  
  .welcome-message h2 {
    font-size: 22px;
  }
  
  .suggestion-chips {
    flex-direction: column;
    align-items: center;
  }
  
  .query-footer {
    padding: 16px;
  }
  
  .send-btn {
    padding: 0 16px;
  }
}
</style>