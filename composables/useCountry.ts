export const useCountry = () => {
  // 跨组件共享的当前国家代码（默认美国，贴近 photogov.net）
  const code = useState<string>('pg-country', () => 'US')
  const setCode = (c: string) => { code.value = c }
  return { code, setCode }
}
