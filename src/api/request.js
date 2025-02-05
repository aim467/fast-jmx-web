import axios from "axios";
import router from "@/router/index";
import { ElMessage } from "element-plus";
import store from "@/store";
// 创建axios实例
const service = axios.create({
  baseURL: "http://127.0.0.1:9999/", // api的base_url
  timeout: 150000, // 请求超时时间
});

// 请求拦截器
service.interceptors.request.use(
  async (config) => {
    // 从 localStorage 获取 token
    // 从store中获取token
    const token = store.state.token;
    // 判断是否需要验证（登录接口不需要验证）
    const whiteList = ['/login'] // 白名单
    const isWhiteList = whiteList.some(path => config.url.includes(path))
    
    if (!isWhiteList) {
      // 如果不是白名单接口，检查是否登录
      if (!token) {
        // 未登录，跳转到登录页
        router.push('/login')
        return Promise.reject(new Error('未登录'))
      }
      // 已登录，添加用户信息到请求头
      config.headers['Authorization'] = `Bearer ${token}`  // 添加 Bearer 前缀
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
);

// 响应拦截器
service.interceptors.response.use(
  function (response) {
    const res = response.data;
    
    switch (res.code) {
      case 200:
        return res;
      case 401: // 未授权或token过期
        ElMessage.error(res.message || '登录已过期，请重新登录')
        store.commit('setToken', null);
        // 跳转到登录页
        router.push({
          path: '/login',
        })
        return Promise.reject(new Error(res.message || '未授权'))
      default:
        // 处理其他错误情况
        if (res.message) {
          ElMessage.error(res.message)
        } else {
          ElMessage.error('未知错误')
        }
        return Promise.reject(res.message)
    }
  },
  function (error) {
    // 处理 HTTP 错误状态
    if (error.response) {
      switch (error.response.status) {
        case 401:
          ElMessage.error(error.response.data?.message || '登录已过期，请重新登录')
          store.commit('setToken', null)  // 新增store token清除
          // 跳转逻辑保持统一
          router.push({
            path: '/login',
            query: { redirect: router.currentRoute.value.fullPath }
          })
          break
        case 403:
          ElMessage.error('没有权限访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器错误')
          break
        default:
          ElMessage.error(error.response.data.message || '请求失败')
      }
    } else if (error.request) {
      ElMessage.error('网络错误，请检查网络连接')
    } else {
      ElMessage.error(error.message)
    }
    return Promise.reject(error)
  }
);

export default service;
