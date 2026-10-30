#!/bin/sh
# PhotoGov 复刻站 — 自托管启动脚本（无需 Docker）
# 前置：Node.js 22.x，且本目录含构建产物 .output
# 用法：
#   PORT=3000 HOST=0.0.0.0 ./start.sh
# 或后台运行：
#   PORT=3000 nohup ./start.sh > server.log 2>&1 &
set -e

export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-3000}"

if [ ! -f ".output/server/index.mjs" ]; then
  echo "错误：未找到 .output/server/index.mjs，请先执行 npm run build 或使用 Docker 镜像。" >&2
  exit 1
fi

echo "启动 PhotoGov 复刻站，监听 ${HOST}:${PORT}"
exec node .output/server/index.mjs
