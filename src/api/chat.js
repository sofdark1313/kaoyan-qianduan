import request from '@/utils/request'

// 获取聊天记录
export function getChatHistory(params) {
  return request({
    url: '/api/chat/history',
    method: 'get',
    params
  })
}

// 保存聊天记录
export function saveChatHistory(data) {
  return request({
    url: '/api/chat/history',
    method: 'post',
    data
  })
}

// 删除聊天记录
export function deleteChatHistory(data) {
  return request({
    url: '/api/chat/history',
    method: 'delete',
    data
  })
} 