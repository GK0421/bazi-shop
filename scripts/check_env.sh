#!/bin/bash
# 环境检测脚本

echo "=== Node.js ==="
node -v || echo "Node.js NOT FOUND"

echo "=== npm ==="
npm -v || echo "npm NOT FOUND"

echo "=== Git ==="
git --version || echo "Git NOT FOUND"

echo "=== gh CLI ==="
gh --version 2>/dev/null || echo "gh NOT FOUND"

echo "=== WeChat DevTools ==="
if [ -d "/c/Program Files (x86)/Tencent/微信web开发者工具" ] || [ -d "/c/Program Files/Tencent/微信web开发者工具" ]; then
    echo "WeChat DevTools FOUND"
else
    echo "WeChat DevTools NOT FOUND"
fi
