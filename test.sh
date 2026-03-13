#!/bin/bash

echo "🧪 测试 Copilot Mini"
echo ""

echo "1️⃣ 健康检查..."
curl -s http://localhost:3000/health | jq
echo ""

echo "2️⃣ 发送问候消息..."
curl -s -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "appName": "assistant",
    "userId": "user123",
    "message": "你好"
  }' | jq
echo ""

echo "3️⃣ 询问配件..."
curl -s -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "appName": "assistant",
    "userId": "user123",
    "message": "我需要查询配件"
  }' | jq
echo ""

echo "4️⃣ 普通消息..."
curl -s -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "appName": "assistant",
    "userId": "user123",
    "message": "今天天气怎么样"
  }' | jq
echo ""

echo "✅ 测试完成！"
