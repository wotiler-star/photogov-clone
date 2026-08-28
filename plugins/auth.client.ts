// 客户端挂载时拉取当前登录态，写入全局 useAuth 状态
export default defineNuxtPlugin(async () => {
  const { refresh } = useAuth()
  await refresh()
})
