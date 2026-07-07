#!/bin/bash
# ============================================
# 道一云AI协同中台 Demo 一键启动脚本
# ============================================

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "========================================"
echo "  道一云AI协同中台 Demo 启动"
echo "========================================"
echo ""

# 检查端口是否被占用
check_port() {
  if lsof -ti:$1 >/dev/null 2>&1; then
    echo "[警告] 端口 $1 被占用，正在释放..."
    lsof -ti:$1 | xargs kill -9 2>/dev/null
    sleep 1
  fi
}

check_port 3000
check_port 5173

# 启动后端
echo "[1/2] 启动后端服务 (端口 3000)..."
cd "$BACKEND_DIR"
npx tsx src/app.ts &
BACKEND_PID=$!
echo "  后端PID: $BACKEND_PID"

# 等待后端就绪
sleep 3
if curl -s http://127.0.0.1:3000/health >/dev/null 2>&1; then
  echo "  ✓ 后端启动成功"
else
  echo "  ✗ 后端启动失败，请检查依赖是否安装"
  exit 1
fi

# 启动前端
echo ""
echo "[2/2] 启动前端服务 (端口 5173)..."
cd "$FRONTEND_DIR"
npx vite --port 5173 &
FRONTEND_PID=$!
echo "  前端PID: $FRONTEND_PID"

sleep 3
echo "  ✓ 前端启动成功"

echo ""
echo "========================================"
echo "  Demo 已就绪！"
echo "========================================"
echo ""
echo "  📱 前端地址:  http://localhost:5173"
echo "  ⚙️  后端地址:  http://localhost:3000"
echo "  📊 API文档:   http://localhost:3000/api"
echo ""
echo "  🔑 默认账号:  admin / admin123"
echo "  🔑 其他账号:  zhangsan / admin123 (审批人)"
echo "                lisi / admin123 (申请人)"
echo "                wangwu / admin123 (法务)"
echo ""
echo "  按Ctrl+C停止所有服务"
echo ""

# 捕获退出信号
trap "echo ''; echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '已停止'; exit 0" INT TERM

# 等待
wait
