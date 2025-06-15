<template>
  <div class="recovery-container">
    <div class="recovery-box">
      <div class="recovery-header">
        <img src="../assets/logo.ico" alt="Logo" class="logo" />
        <h2>找回密码</h2>
        <p class="subtitle">重置您的账户密码</p>
      </div>
      
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="recovery-form"
        @submit.prevent="handleRecovery"
      >
        <el-form-item prop="phoneNumber">
          <el-input
            v-model="form.phoneNumber"
            :prefix-icon="Phone"
            placeholder="请输入注册手机号"
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
              size="large"
            >
              {{ cooldown > 0 ? `${cooldown}秒后重试` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item prop="newPassword">
          <el-input
            v-model="form.newPassword"
            :prefix-icon="Lock"
            type="password"
            placeholder="请输入新密码"
            size="large"
            show-password
          />
        </el-form-item>

        <div class="form-footer">
          <el-button
            type="primary"
            native-type="submit"
            :loading="loading"
            size="large"
            class="submit-btn"
          >
            重置密码
          </el-button>
          
          <div class="login-link">
            想起密码了？
            <el-button
              type="primary"
              link
              @click="$router.push('/login')"
            >
              返回登录
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
import { Phone, Key, Lock } from '@element-plus/icons-vue'
import { recovery } from '@/api'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const cooldown = ref(0)

const form = reactive({
  phoneNumber: '',
  verifyCode: '',
  newPassword: ''
})

const rules = {
  phoneNumber: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  verifyCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
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

  // 开始倒计时
  cooldown.value = 60
  const timer = setInterval(() => {
    cooldown.value--
    if (cooldown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
  
  ElMessage.success('验证码已发送（wc666）')
}

// 重置密码
const handleRecovery = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    await recovery(form)
    ElMessage.success('密码重置成功')
    router.push('/login')
  } catch (error) {
    console.error('Recovery error:', error)
    ElMessage.error(error.response?.data?.message || '密码重置失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.recovery-container {
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

.recovery-box {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.recovery-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  width: 80px;
  height: 80px;
  margin-bottom: 16px;
}

.subtitle {
  color: #909399;
  margin-top: 8px;
}

.verify-code-wrapper {
  display: flex;
  gap: 10px;
}

.verify-code-btn {
  flex-shrink: 0;
}

.submit-btn {
  width: 100%;
  margin-top: 10px;
}

.login-link {
  text-align: center;
  margin-top: 16px;
  color: #606266;
}

.form-footer {
  margin-top: 20px;
}
</style>