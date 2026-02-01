#!/bin/bash

# Railway 快速部署脚本
# 用于将 GoChinaMed 项目部署到 Railway 云平台

set -e

echo "==================================="
echo "GoChinaMed Railway 部署脚本"
echo "==================================="
echo ""

# 检查 Railway CLI 是否安装
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI 未安装"
    echo ""
    echo "请先安装 Railway CLI:"
    echo "  npm install -g @railway/cli"
    echo ""
    echo "安装后，请运行: railway login"
    exit 1
fi

echo "✅ Railway CLI 已安装"
echo ""

# 检查是否已登录
echo "📋 检查登录状态..."
if ! railway whoami &> /dev/null; then
    echo "❌ 您还未登录 Railway"
    echo ""
    echo "请先登录:"
    echo "  railway login"
    exit 1
fi

echo "✅ 已登录到 Railway"
echo ""

# 初始化 Railway 项目（如果未初始化）
if [ ! -f ".railway/config.json" ]; then
    echo "🚀 初始化 Railway 项目..."
    railway init --name gochina-med
    echo "✅ Railway 项目已初始化"
else
    echo "✅ Railway 项目已存在"
fi

echo ""

# 部署到 Railway
echo "📦 正在部署到 Railway..."
echo "这可能需要几分钟，请耐心等待..."
echo ""

railway up

echo ""
echo "==================================="
echo "✅ 部署完成！"
echo "==================================="
echo ""
echo "📋 获取项目信息..."
railway status

echo ""
echo "🌐 获取访问地址..."
echo "请在 Railway 控制台中查看项目的访问域名"
echo "格式: https://your-project.railway.app"
echo ""
echo "📱 下载页面地址: https://your-project.railway.app/app-download"
echo ""
echo "💡 提示:"
echo "  - 查看日志: railway logs"
echo "  - 查看状态: railway status"
echo "  - 打开项目: railway open"
echo ""
