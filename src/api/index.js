import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8088/api',
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('Response error:', error)
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('accountId')
      localStorage.removeItem('accountName')
      localStorage.removeItem('accountIdentity')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 登录
export const login = (data) => {
  return api.post('/login', data)
}

// 注册
export const register = (data) => {
  return api.post('/register', data)
}

// 找回密码
export const recovery = (data) => {
  return api.post('/recovery', data)
}

// 修改密码
export const changePassword = (data) => {
  return api.put('/password', data)
}

// 注销账户
export const deactivateAccount = (data) => {
  return api.delete('/deactivate', { data })
}

// AI 聊天
export const chatFinal = (data) => {
  return api.post('/ai/chat-final', data)
}

// 升级
export const upgradeVIP = (data) => {
  return api.post('/upgrade', data)
}

// 获取聊天记录
export const getChatHistory = (params) => {
  return api.get('/chat/history', {
    params: {
      accountId: params.accountId,
      dialogId: params.dialogId
    }
  })
}

// 保存聊天记录
export const saveChatHistory = (data) => {
  return api.post('/chat/history', data)
}

// 删除聊天记录
export const deleteChatHistory = (accountId, dialogId) => {
  return api.delete('/chat/history', {
    data: { accountId, dialogId }
  })
}

export const getAccountInfo = (accountId) => {
  return api.get(`/account/${accountId}`,{
    data: { accountId }
  })
}