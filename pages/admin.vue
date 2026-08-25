<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

definePageMeta({ layout: false })

const authed = ref(false)
const password = ref('')
const loginErr = ref('')
const loading = ref(false)

const docs = ref<any[]>([])
const countries = ref<any[]>([])
const msg = ref('')

// 编辑态
const editing = ref<any | null>(null)
const showForm = ref(false)

async function tryAuth() {
  try {
    const res = await $fetch('/api/admin/documents')
    docs.value = res.documents
    authed.value = true
    await loadCountries()
  } catch {
    authed.value = false
  }
}

async function loadCountries() {
  try {
    const res = await $fetch('/api/admin/countries')
    countries.value = res.countries
  } catch {}
}

async function login() {
  loading.value = true
  loginErr.value = ''
  try {
    const res = await $fetch('/api/admin/login', { method: 'POST', body: { password: password.value } })
    if (res.ok) {
      await tryAuth()
    } else {
      loginErr.value = '密码错误'
    }
  } catch {
    loginErr.value = '登录失败'
  } finally {
    loading.value = false
  }
}

async function logout() {
  await $fetch('/api/admin/logout', { method: 'POST' })
  authed.value = false
  docs.value = []
}

function openCreate() {
  editing.value = {
    slug: '', name: '', country: 'US', countryName: 'United States',
    title: '', category: 'passport', popular: false, quickLink: false,
    headHeight: '1.29 inch', eyesLevel: '1.18 inch', background: '#FFFFFF',
    format: 'JPEG', dpi: 300, size: { inch: '2x2', mm: '51x51', cm: '5.1x5.1', px: '600x600', w: 600, h: 600 }
  }
  showForm.value = true
}

function openEdit(d: any) {
  editing.value = JSON.parse(JSON.stringify(d))
  showForm.value = true
}

async function save() {
  loading.value = true
  msg.value = ''
  try {
    if (docs.value.find((d) => d.slug === editing.value.slug)) {
      await $fetch(`/api/admin/documents/${editing.value.slug}`, { method: 'PUT', body: editing.value })
      msg.value = '已更新'
    } else {
      await $fetch('/api/admin/documents', { method: 'POST', body: editing.value })
      msg.value = '已创建'
    }
    showForm.value = false
    await tryAuth()
  } catch (e: any) {
    msg.value = '保存失败：' + (e?.data?.statusMessage || e.message)
  } finally {
    loading.value = false
  }
}

async function remove(d: any) {
  if (!confirm(`删除 ${d.name}?`)) return
  await $fetch(`/api/admin/documents/${d.slug}`, { method: 'DELETE' })
  await tryAuth()
}

const fields = computed(() => [
  { k: 'slug', label: 'Slug', type: 'text' },
  { k: 'name', label: '名称', type: 'text' },
  { k: 'country', label: '国家代码', type: 'text' },
  { k: 'countryName', label: '国家名', type: 'text' },
  { k: 'title', label: '标题', type: 'text' },
  { k: 'category', label: '类别', type: 'text' },
  { k: 'headHeight', label: '头部位高', type: 'text' },
  { k: 'eyesLevel', label: '眼睛高度', type: 'text' },
  { k: 'background', label: '背景色', type: 'text' },
  { k: 'format', label: '格式', type: 'text' },
  { k: 'dpi', label: 'DPI', type: 'number' }
])

onMounted(tryAuth)
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-ink">
    <!-- 登录 -->
    <div v-if="!authed" class="flex min-h-screen items-center justify-center p-4">
      <div class="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-soft">
        <h1 class="text-2xl font-bold">PhotoGov 管理后台</h1>
        <p class="mt-1 text-sm text-muted">请输入管理员密码</p>
        <input
          v-model="password"
          type="password"
          placeholder="密码"
          class="mt-4 w-full rounded border border-slate-300 px-3 py-2"
          @keyup.enter="login"
        />
        <p v-if="loginErr" class="mt-2 text-sm text-red-600">{{ loginErr }}</p>
        <button
          class="mt-4 w-full rounded bg-brand-cta px-4 py-2 font-semibold text-white hover:opacity-80"
          :disabled="loading"
          @click="login"
        >
          {{ loading ? '登录中…' : '登录' }}
        </button>
        <p class="mt-3 text-xs text-muted">默认密码：photogov-admin（可用 ADMIN_PASSWORD 环境变量覆盖）</p>
      </div>
    </div>

    <!-- 仪表盘 -->
    <div v-else class="mx-auto max-w-6xl p-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">管理后台 · 证件内容</h1>
        <div class="flex gap-2">
          <button class="rounded bg-brand-cta px-4 py-2 font-semibold text-white hover:opacity-80" @click="openCreate">+ 新建证件</button>
          <button class="rounded border border-slate-300 px-4 py-2 hover:bg-slate-100" @click="logout">退出</button>
        </div>
      </div>

      <p v-if="msg" class="mt-3 rounded bg-green-50 px-3 py-2 text-sm text-green-700">{{ msg }}</p>

      <div class="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-100 text-xs uppercase text-muted">
            <tr>
              <th class="px-4 py-3">Slug</th>
              <th class="px-4 py-3">名称</th>
              <th class="px-4 py-3">国家</th>
              <th class="px-4 py-3">类别</th>
              <th class="px-4 py-3">热门</th>
              <th class="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in docs" :key="d.slug" class="border-t border-slate-100">
              <td class="px-4 py-2 font-mono text-xs">{{ d.slug }}</td>
              <td class="px-4 py-2">{{ d.name }}</td>
              <td class="px-4 py-2">{{ d.countryName }}</td>
              <td class="px-4 py-2">{{ d.category }}</td>
              <td class="px-4 py-2">{{ d.popular ? '✓' : '' }}</td>
              <td class="px-4 py-2 text-right">
                <button class="text-brand-blue hover:underline" @click="openEdit(d)">编辑</button>
                <button class="ml-3 text-red-600 hover:underline" @click="remove(d)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="mt-3 text-xs text-muted">共 {{ docs.length }} 个证件 · {{ countries.length }} 个国家</p>
    </div>

    <!-- 编辑/新建表单 -->
    <div v-if="showForm && editing" class="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
      <div class="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-card">
        <h2 class="text-xl font-bold">{{ docs.find((d) => d.slug === editing.slug) ? '编辑证件' : '新建证件' }}</h2>
        <div class="mt-4 grid grid-cols-2 gap-3">
          <label v-for="f in fields" :key="f.k" class="flex flex-col text-sm">
            <span class="text-muted">{{ f.label }}</span>
            <input
              v-model="editing[f.k]"
              :type="f.type"
              class="mt-1 rounded border border-slate-300 px-2 py-1.5"
            />
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input v-model="editing.popular" type="checkbox" /> 热门
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input v-model="editing.quickLink" type="checkbox" /> 快捷链接
          </label>
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <button class="rounded border border-slate-300 px-4 py-2 hover:bg-slate-100" @click="showForm = false">取消</button>
          <button class="rounded bg-brand-cta px-4 py-2 font-semibold text-white hover:opacity-80" :disabled="loading" @click="save">
            {{ loading ? '保存中…' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
