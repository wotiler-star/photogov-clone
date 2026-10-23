<script setup lang="ts">
/**
 * /forgot-password → 301 重定向到 /sign-in（对齐原站 IA，SEEN：原站该路由 404，
 * 密码重置流程在 /sign-in/ 页内以「Reset password」视图完成）。
 *
 * 本站后端的重置邮件指向 /reset-password?token=...（保留该路由），
 * 没有任何邮件或入口指向 /forgot-password，故可安全 301。
 */
const localePath = useLocalePath()

await navigateTo(localePath('/sign-in'), { redirectCode: 301 })
</script>

<template>
  <div />
</template>
