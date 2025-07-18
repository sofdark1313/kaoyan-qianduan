<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <img src="../assets/logo.ico" alt="Logo" class="logo" />
        <h2>AI 学业助手</h2>
        <p class="subtitle">智能对话，随时随地</p>
      </div>
      
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form"
        @submit.prevent="handleSubmit"
      >
        <el-form-item prop="account">
          <el-input
            v-model="form.account"
            :prefix-icon="User"
            placeholder="请输入账号"
            size="large"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            :prefix-icon="Lock"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password
          />
          <div class="forgot-password">
            <el-button type="primary" link @click="$router.push('/recovery')">忘记密码？</el-button>
          </div>
        </el-form-item>

        <div class="form-footer">
          <el-button
            type="primary"
            native-type="submit"
            :loading="loading"
            size="large"
            class="submit-btn"
          >
            登录
          </el-button>
          
          <div class="register-link">
            还没有账号？
            <el-button
              type="primary"
              link
              @click="$router.push('/register')"
            >
              立即注册
            </el-button>
          </div>
        </div>
      </el-form>
    </div>

    <!-- 找回密码对话框 -->
    <el-dialog
      v-model="recoveryDialog"
      title="找回密码"
      width="400px"
      center
      destroy-on-close
    >
      <el-form :model="recoveryForm" :rules="recoveryRules" ref="recoveryFormRef">
        <el-form-item prop="phoneNumber" label="手机号码">
          <el-input
            v-model="recoveryForm.phoneNumber"
            :prefix-icon="Phone"
            placeholder="请输入注册手机号"
          />
        </el-form-item>

        <el-form-item prop="verifyCode" label="验证码">
          <div class="verify-code-wrapper">
            <el-input
              v-model="recoveryForm.verifyCode"
              :prefix-icon="Key"
              placeholder="请输入验证码"
            />
            <el-button 
              type="primary" 
              :disabled="cooldown > 0"
              @click="handleSendCode"
              class="verify-code-btn"
            >
              {{ cooldown > 0 ? `${cooldown}秒后重试` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item prop="newPassword" label="新密码">
          <el-input
            v-model="recoveryForm.newPassword"
            :prefix-icon="Lock"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="recoveryDialog = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleRecovery"
          :loading="recoveryLoading"
        >
          确认重置
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Phone, Key } from '@element-plus/icons-vue'
import { login, recovery } from '@/api'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  account: '',
  password: ''
})

const rules = {
  account: [
    { required: true, message: '请输入账号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

// 找回密码相关
const recoveryDialog = ref(false)
const recoveryFormRef = ref(null)
const recoveryLoading = ref(false)
const cooldown = ref(0)

const recoveryForm = reactive({
  phoneNumber: '',
  verifyCode: '',
  newPassword: ''
})

const recoveryRules = {
  phoneNumber: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  
  ]
}

// 显示找回密码对话框
const showRecoveryDialog = () => {
  recoveryDialog.value = true
}

// 发送验证码
const handleSendCode = async () => {
  if (!recoveryForm.phoneNumber) {
    ElMessage.warning('请先输入手机号码')
    return
  }
  
  if (!/^1[3-9]\d{9}$/.test(recoveryForm.phoneNumber)) {
    ElMessage.warning('请输入正确的手机号码')
    return
  }

  // 开始倒计时
  cooldown.value = 60
  const timer = setInterval(() => {
    cooldown.value--
    if (cooldown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
  
  ElMessage.success('验证码已发送')
}

// 重置密码
const handleRecovery = async () => {
  if (!recoveryFormRef.value) return
  
  try {
    await recoveryFormRef.value.validate()
    recoveryLoading.value = true
    
    const res = await recovery(recoveryForm)
    if (res.code === 1) {
      ElMessage.success('密码重置成功')
      recoveryDialog.value = false
      // 自动填充找回的账号
      form.account = res.data.account
    } else {
      ElMessage.error(res.msg || '密码重置失败')
    }
  } catch (error) {
    console.error('Recovery error:', error)
    ElMessage.error('密码重置失败，请稍后重试')
  } finally {
    recoveryLoading.value = false
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    const res = await login(form)
    if (res.code === 1) {
      ElMessage.success('登录成功')
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('accountId', res.data.accountId)
      localStorage.setItem('accountIdentity', res.data.accountIdentity)
      localStorage.setItem('accountName', form.account)
      router.push('/chat')
    } else {
      ElMessage.error(res.msg || '登录失败')
    }
  } catch (error) {
    console.error('Login error:', error)
    ElMessage.error('登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, hsl(193, 34%, 47%) 0%, hsl(230, 90%, 39%) 100%);
    overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.login-box {
  width: 90%;
  max-width: 420px;
  padding: 40px 20px;
  margin: auto;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  width: 80px;
  height: 80px;
  margin-bottom: 16px;
}

h2 {
  font-size: 28px;
  color: #333;
  margin: 0 0 8px;
  font-weight: 600;
}

.subtitle {
  color: #666;
  font-size: 16px;
  margin: 0;
}

.login-form {
  .el-form-item {
    margin-bottom: 24px;
  }

  :deep(.el-input__wrapper) {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    border-radius: 8px;
    height: 48px;
    padding: 0 16px;
  }

  :deep(.el-input__inner) {
    font-size: 16px;
  }
}

.form-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: 32px;
}

.submit-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  border-radius: 8px;
  background: linear-gradient(135deg, hsl(193, 34%, 47%) 0%, hsl(230, 90%, 39%) 100%);
  border: none;

  &:hover {
    background: linear-gradient(135deg, hsl(193, 34%, 47%) 0%, hsl(230, 90%, 39%) 100%);  }

  &:active {
    background: linear-gradient(135deg, hsl(193, 34%, 47%) 0%, hsl(230, 90%, 39%) 100%);  }
}

.register-link {
  color: #666;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 响应式调整 */
@media screen and (max-width: 480px) {
  .login-container {
    padding: 0;
  }
  
  .login-box {
    width: 100%;
    height: 100%;
    margin: 0;
    border-radius: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .login-form {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .form-footer {
    margin-top: auto;
    padding-bottom: 32px;
  }
}

.forgot-password {
  text-align: right;
  margin-top: 4px;
}

.verify-code-wrapper {
  display: flex;
  gap: 12px;
}

.verify-code-btn {
  flex-shrink: 0;
  height: 40px;
  padding: 0 20px;
  font-size: 14px;
  border-radius: 8px;
  background: linear-gradient(135deg, hsl(193, 34%, 47%) 0%, hsl(230, 90%, 39%) 100%);
  border: none;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.verify-code-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.verify-code-btn:disabled {
  background: #e0e0e0;
  cursor: not-allowed;
}
</style>