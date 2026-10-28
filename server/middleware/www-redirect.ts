// 规范化：裸域 photogov.xyz -> https://www.photogov.xyz（301，保留路径与查询参数）
// 用 Host 判断，www 不会跳自己，因此不会形成重定向循环。
// 说明：Hostinger 后台的 Redirects 工具会整站命中（含 www），不能用来做此跳转，故在应用层实现。
export default defineEventHandler((event) => {
  const host = (getRequestHeader(event, 'host') || '').split(':')[0]
  if (host === 'photogov.xyz') {
    const url = getRequestURL(event)
    url.protocol = 'https:'
    url.host = 'www.photogov.xyz'
    return sendRedirect(event, url.toString(), 301)
  }
})
