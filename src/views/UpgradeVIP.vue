<template>
  <div class="upgrade-container">
    <div class="upgrade-box">
      <div class="upgrade-header">
        <h2>升级VIP会员</h2>
        <p class="subtitle">享受更多专属特权</p>
      </div>
      
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="upgrade-form"
        @submit.prevent="handleSubmit"
      >
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

        <el-form-item prop="paymentType">
          <el-radio-group v-model="form.paymentType">
            <el-radio label="wechat" size="large">
              <el-icon><Iphone /></el-icon>
              微信支付
            </el-radio>
            <el-radio label="alipay" size="large">
              <el-icon><Money /></el-icon>
              支付宝
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item prop="duration">
          <el-radio-group v-model="form.duration" class="duration-group">
            <el-radio :label="1" border>
              <div class="duration-option">
                <div class="duration-title">1个月 ¥30</div>
              </div>
            </el-radio>
            <el-radio :label="3" border>
              <div class="duration-option">
                <div class="duration-title">3个月 ¥80</div>
              </div>
            </el-radio>
            <el-radio :label="6" border>
              <div class="duration-option">
                <div class="duration-title">6个月 ¥150</div>
              </div>
            </el-radio>
            <el-radio :label="12" border>
              <div class="duration-option">
                <div class="duration-title">1年 ¥280</div>
              </div>
            </el-radio>
            <el-radio :label="24" border>
              <div class="duration-option">
                <div class="duration-title">2年 ¥560</div>
              </div>
            </el-radio>
            <el-radio :label="36" border>
              <div class="duration-option">
                <div class="duration-title">3年 ¥680</div>
              </div>
            </el-radio>
            <el-radio :label="999" border>
              <div class="duration-option">
                <div class="duration-title">永久 ¥1280</div>
              </div>
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <div class="form-footer">
          <el-button
            type="primary"
            native-type="submit"
            :loading="loading"
            size="large"
            class="submit-btn"
          >
            立即升级
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Key, Iphone, Money } from '@element-plus/icons-vue'
import { upgradeVIP } from '@/api'

const formRef = ref(null)
const loading = ref(false)
const cooldown = ref(0)

const form = reactive({
  verifyCode: '',
  paymentType: 'wechat',
  duration: 1 // 默认选择1个月
})

const rules = {
  verifyCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
  ],
  paymentType: [
    { required: true, message: '请选择支付方式', trigger: 'change' }
  ]
}

// 发送验证码
const handleSendCode = async () => {
  try {
    // 开始倒计时
    cooldown.value = 60
    const timer = setInterval(() => {
      cooldown.value--
      if (cooldown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
    
    ElMessage.success('验证码已发送：wc233')
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
    
    const res = await upgradeVIP({
      accountId: localStorage.getItem('accountId'),
      verifyCode: form.verifyCode,
      paymentType: form.paymentType
    })
    
    if (res.code === 1) {
      ElMessage.success('升级VIP成功')
      localStorage.setItem('accountIdentity', 'VIP用户')
      localStorage.setItem('vipExpireTime', res.data.expireTime)
    } else {
      ElMessage.error(res.msg || '升级失败')
    }
  } catch (error) {
    console.error('Upgrade error:', error)
    ElMessage.error('升级失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.upgrade-container {
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

.upgrade-box {
  width: 90%;
  max-width: 500px;
  padding: 40px 30px;
  margin: auto;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.upgrade-header {
  text-align: center;
  margin-bottom: 32px;
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
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.subtitle {
  color: #888;
  font-size: 16px;
  margin: 0;
  font-weight: 400;
}

.duration-group {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin: 24px 0;
}

.duration-option {
  padding: 20px 16px;
  text-align: center;
  transition: all 0.3s ease;
  border-radius: 12px;
  background: #f9f9f9;
}

.duration-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.duration-price {
  color: #f56c6c;
  font-weight: bold;
  font-size: 18px;
  margin-top: 8px;
}

:deep(.el-radio.is-bordered) {
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 12px;
  overflow: hidden;
}

:deep(.el-radio.is-bordered:hover .duration-option) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: #fff;
}

:deep(.el-radio.is-bordered.is-checked .duration-option) {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border: 1px solid #764ba2;
  box-shadow: 0 4px 12px rgba(118, 75, 162, 0.15);
}

.submit-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 12px;
  background: linear-gradient(135deg, hsl(193, 34%, 47%) 0%, hsl(230, 90%, 39%) 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(118, 75, 162, 0.2);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(118, 75, 162, 0.3);
    background: linear-gradient(135deg, hsl(193, 34%, 47%) 0%, hsl(230, 90%, 39%) 100%);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(118, 75, 162, 0.3);
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

.el-radio {
  margin-right: 20px;
}
</style>