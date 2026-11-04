#!/bin/sh
# PhotoGov 复刻站 — 自托管启动脚本（无需 Docker）
# 前置：Node.js 22.x，且本目录含构建产物 .output
# 用法（用 sh 调用，不依赖可执行位）：
#   PORT=3000 HOST=0.0.0.0 sh ./start.sh
# 或后台运行：
#   PORT=3000 nohup sh ./start.sh > server.log 2>&1 &
set -e

export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-3000}"
# 裸 Node 启动时默认按生产模式运行：否则 NODE_ENV 未设会让 EMAIL_DEBUG 自动为 true，
# 把带 token 的验证/重置链接回传给客户端（生产环境不应回传 devLink）。
export NODE_ENV="${NODE_ENV:-production}"

if [ ! -f ".output/server/index.mjs" ]; then
  echo "错误：未找到 .output/server/index.mjs，请先执行 npm run build 或使用 Docker 镜像。" >&2
  exit 1
fi

# Nitro 生产运行时只读 process.env，不会自己加载 .env。
# 显式注入 .env，否则其中配置的 SMTP_* / SESSION_SECRET 等运行时变量全部不生效，
# 验证/重置邮件只会打到控制台日志，用户永远收不到。
if [ -f ".env" ]; then
  echo "启动 PhotoGov 复刻站，监听 ${HOST}:${PORT}（已加载 .env）"
  exec node --env-file=.env .output/server/index.mjs
fi

echo "启动 PhotoGov 复刻站，监听 ${HOST}:${PORT}"
exec node .output/server/index.mjs
