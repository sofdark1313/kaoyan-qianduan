<template>
  <div class="register-container">
    <div class="register-box">
      <div class="register-header">
        <img src="../assets/logo.ico" alt="Logo" class="logo" />
        <h2>创建账号</h2>
        <p class="subtitle">加入我们，开启智能对话之旅</p>
      </div>
      
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="register-form"
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
        </el-form-item>

        <el-form-item prop="accountName">
          <el-input
            v-model="form.accountName"
            :prefix-icon="UserFilled"
            placeholder="请输入用户昵称"
            size="large"
          />
        </el-form-item>

        <el-form-item prop="phoneNumber">
          <el-input
            v-model="form.phoneNumber"
            :prefix-icon="Phone"
            placeholder="请输入手机号码"
            size="large"
          />
        </el-form-item>

        <el-form-item prop="verifyCode">
          <div class="verify-code-wrapper">
            <el-input
              v-model="form.verifyCode"
              :prefix-icon="Key"
              placeholder="请输入验证码"
              size="large"
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

        <div class="form-footer">
          <el-button
            type="primary"
            native-type="submit"
            :loading="loading"
            size="large"
            class="submit-btn"
          >
            注册
          </el-button>
          
          <div class="login-link">
            已有账号？
            <el-button
              type="primary"
              link
              @click="$router.push('/login')"
            >
              立即登录
            </el-button>
          </div>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, UserFilled, Phone, Key } from '@element-plus/icons-vue'
import { register } from '@/api'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const cooldown = ref(0)

const form = reactive({
  account: '',
  password: '',
  accountName: '',
  phoneNumber: '',
  verifyCode: ''
})

const rules = {
  phoneNumber: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ]
}

// 发送验证码
const handleSendCode = async () => {
  if (!form.phoneNumber) {
    ElMessage.warning('请先输入手机号码')
    return
  }
  
  if (!/^1[3-9]\d{9}$/.test(form.phoneNumber)) {
    ElMessage.warning('请输入正确的手机号码')
    return
  }

  try {
    // TODO: 调用发送验证码接口
    // const res = await sendVerifyCode(form.phoneNumber)
    
    // 开始倒计时
    cooldown.value = 60
    const timer = setInterval(() => {
      cooldown.value--
      if (cooldown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
    
    ElMessage.success('验证码已发送')
  } catch (error) {
    console.error('Send verify code error:', error)
    ElMessage.error('验证码发送失败，请稍后重试')
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    const res = await register(form)
    if (res.code === 1) {
      ElMessage.success('注册成功')
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('accountId', res.data.accountId)
      localStorage.setItem('accountName', form.accountName)
      localStorage.setItem('accountIdentity', '普通用户')
      router.push('/chat')
    } else {
      ElMessage.error(res.msg || '注册失败')
    }
  } catch (error) {
    console.error('Register error:', error)
    ElMessage.error('注册失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
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

.register-box {
  width: 90%;
  max-width: 420px;
  padding: 40px 20px;
  margin: auto;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.register-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  width: 80px;
  height: 80px;
  margin-bottom: 16px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
  animation: logoFloat 3s ease-in-out infinite;
}

@keyframes logoFloat {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
  100% { transform: translateY(0px); }
}

h2 {
  font-size: 28px;
  color: #333;
  margin: 0 0 8px;
  font-weight: 600;
  background: linear-gradient(135deg, hsl(193, 34%, 47%) 0%, hsl(230, 90%, 39%) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: #666;
  font-size: 16px;
  margin: 0;
}

.register-form {
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
    background: linear-gradient(135deg, hsl(193, 34%, 47%) 0%, hsl(230, 90%, 39%) 100%);
  }

  &:active {
    background: linear-gradient(135deg, hsl(193, 34%, 47%) 0%, hsl(230, 90%, 39%) 100%);
  }
}

.login-link {
  color: #666;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 响应式调整 */
@media screen and (max-width: 480px) {
  .register-container {
    padding: 0;
  }
  
  .register-box {
    width: 100%;
    height: 100%;
    margin: 0;
    border-radius: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .register-form {
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