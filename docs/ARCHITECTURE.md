# Copilot-Mini 后端架构设计文档

> 版本: v1.0  
> 日期: 2026-03-23  
> 状态: 待开发

---

## 1. 系统概述

### 1.1 目标
为 copilot-web 前端提供用户认证和会话存储能力，支持跨设备同步。

### 1.2 技术栈

| 组件 | 技术 |
|------|------|
| 框架 | Fastify |
| 数据库 | MongoDB |
| 认证 | JWT (JSON Web Token) |
| 密码加密 | bcrypt |

---

## 2. 数据模型设计

### 2.1 User 模型

```typescript
// src/model/User.ts

interface IUser {
  _id: ObjectId;
  email: string;        // 唯一，登录账号
  password: string;     // bcrypt 加密后的密码
  nickname?: string;     // 昵称
  avatar?: string;      // 头像 URL
  createdAt: Date;
  updatedAt: Date;
}
```

**API 路径**: `/api/users`

| 字段 | 类型 | 约束 |
|------|------|------|
| email | String | 唯一，必填 |
| password | String | 必填，最小 6 位 |
| nickname | String | 可选，最大 50 字符 |
| avatar | String | 可选，URL 格式 |

### 2.2 Session 模型

```typescript
// src/model/Session.ts

interface ISession {
  _id: ObjectId;
  userId: ObjectId;           // 关联 User
  title: string;              // 会话标题
  messages: IMessage[];       // 消息列表
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;           // 可选的过期时间
}

interface IMessage {
  id: string;                 // 消息 ID (uuid)
  role: 'user' | 'assistant'; // 角色
  content: string;             // 内容
  timestamp: number;           // 时间戳
}
```

**API 路径**: `/api/sessions`

| 字段 | 类型 | 约束 |
|------|------|------|
| userId | ObjectId | 必填，关联用户 |
| title | String | 必填，最大 100 字符 |
| messages | Array | 可选，默认空数组 |
| expiresAt | Date | 可选 |

---

## 3. API 设计

### 3.1 认证相关

#### POST /api/auth/register - 注册

**请求**:
```json
{
  "email": "user@example.com",
  "password": "123456",
  "nickname": "用户昵称"
}
```

**响应** (201):
```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "userId": "64abc123...",
    "email": "user@example.com",
    "nickname": "用户昵称"
  }
}
```

**错误码**:
- 400: 邮箱格式错误 / 密码太短 / 邮箱已存在

#### POST /api/auth/login - 登录

**请求**:
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

**响应** (200):
```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "userId": "64abc123...",
      "email": "user@example.com",
      "nickname": "用户昵称"
    }
  }
}
```

**错误码**:
- 400: 参数错误
- 401: 邮箱或密码错误

#### GET /api/auth/me - 获取当前用户

**Headers**: `Authorization: Bearer <token>`

**响应** (200):
```json
{
  "code": 0,
  "data": {
    "userId": "64abc123...",
    "email": "user@example.com",
    "nickname": "用户昵称"
  }
}
```

**错误码**:
- 401: 未登录 / Token 无效

#### POST /api/auth/logout - 登出

**Headers**: `Authorization: Bearer <token>`

**响应** (200):
```json
{
  "code": 0,
  "message": "登出成功"
}
```

---

### 3.2 会话相关

#### GET /api/sessions - 获取会话列表

**Headers**: `Authorization: Bearer <token>`

**查询参数**:
- `page`: 页码，默认 1
- `pageSize`: 每页数量，默认 20

**响应** (200):
```json
{
  "code": 0,
  "data": {
    "sessions": [
      {
        "id": "64abc123...",
        "title": "React Hooks 讨论",
        "messageCount": 5,
        "createdAt": "2026-03-23T10:00:00Z",
        "updatedAt": "2026-03-23T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 50
    }
  }
}
```

#### POST /api/sessions - 创建会话

**Headers**: `Authorization: Bearer <token>`

**请求**:
```json
{
  "title": "新对话"
}
```

**响应** (201):
```json
{
  "code": 0,
  "message": "创建成功",
  "data": {
    "id": "64abc123...",
    "title": "新对话",
    "messages": [],
    "createdAt": "2026-03-23T10:00:00Z",
    "updatedAt": "2026-03-23T10:00:00Z"
  }
}
```

#### GET /api/sessions/:id - 获取会话详情

**Headers**: `Authorization: Bearer <token>`

**响应** (200):
```json
{
  "code": 0,
  "data": {
    "id": "64abc123...",
    "title": "React Hooks 讨论",
    "messages": [
      {
        "id": "msg-1",
        "role": "user",
        "content": "什么是 useState？",
        "timestamp": 1711173600000
      },
      {
        "id": "msg-2",
        "role": "assistant",
        "content": "useState 是...",
        "timestamp": 1711173605000
      }
    ],
    "createdAt": "2026-03-23T10:00:00Z",
    "updatedAt": "2026-03-23T10:30:00Z"
  }
}
```

**错误码**:
- 404: 会话不存在 / 无权访问

#### PUT /api/sessions/:id - 更新会话

**Headers**: `Authorization: Bearer <token>`

**请求**:
```json
{
  "title": "新的标题"
}
```

**响应** (200):
```json
{
  "code": 0,
  "message": "更新成功"
}
```

#### DELETE /api/sessions/:id - 删除会话

**Headers**: `Authorization: Bearer <token>`

**响应** (200):
```json
{
  "code": 0,
  "message": "删除成功"
}
```

---

### 3.3 消息相关

#### POST /api/sessions/:id/messages - 添加消息

**Headers**: `Authorization: Bearer <token>`

**请求**:
```json
{
  "role": "user",
  "content": "用户输入的消息"
}
```

**响应** (201):
```json
{
  "code": 0,
  "data": {
    "id": "msg-new123",
    "role": "user",
    "content": "用户输入的消息",
    "timestamp": 1711173600000
  }
}
```

#### DELETE /api/sessions/:id/messages - 清空消息

**Headers**: `Authorization: Bearer <token>`

**响应** (200):
```json
{
  "code": 0,
  "message": "消息已清空"
}
```

---

## 4. 统一响应格式

```typescript
// 成功
{
  "code": 0,
  "message": "操作成功",
  "data": { ... }
}

// 失败
{
  "code": 错误码,
  "message": "错误描述",
  "data": null
}
```

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 400 | 参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

---

## 5. 安全设计

### 5.1 密码安全
- 使用 bcrypt 加密，cost factor = 10
- 密码最小长度 6 位

### 5.2 Token 设计
- 使用 JWT (jsonwebtoken)
- Token 有效期 7 天
- Payload: `{ userId, email }`

### 5.3 权限控制
- 用户只能操作自己的会话
- 查询时自动过滤 userId

---

## 6. 目录结构

```
copilot-mini/src/
├── model/
│   ├── User.ts          # 用户模型
│   ├── Session.ts       # 会话模型
│   └── index.ts
├── route/
│   ├── auth.ts          # 认证路由
│   ├── session.ts       # 会话路由
│   └── index.ts
├── middleware/
│   └── auth.ts          # JWT 验证中间件
├── service/
│   ├── auth.service.ts  # 认证服务
│   └── session.service.ts # 会话服务
└── utils/
    └── response.ts      # 统一响应工具
```

---

## 7. 开发任务拆分

### 后端任务

| # | 任务 | 工时 | 状态 |
|---|------|------|------|
| 1 | User 模型 | 1h | 🔄 |
| 2 | Session 模型 | 1h | 🔄 |
| 3 | 统一响应工具 | 0.5h | 🔄 |
| 4 | JWT 中间件 | 1h | 🔄 |
| 5 | Auth Service | 2h | 🔄 |
| 6 | Auth 路由 (注册/登录/登出) | 2h | 🔄 |
| 7 | Session Service | 3h | 🔄 |
| 8 | Session 路由 (CRUD) | 3h | 🔄 |
| 9 | 单元测试 | 3h | 🔄 |
| **总计** | | **16.5h** | |

### 前端任务

| # | 任务 | 工时 | 状态 |
|---|------|------|------|
| 1 | API 层封装 | 2h | 🔄 |
| 2 | Auth Context | 2h | 🔄 |
| 3 | 登录/注册页面 | 3h | 🔄 |
| 4 | 前端 storage 切换 | 2h | 🔄 |
| 5 | 对接后端 API | 3h | 🔄 |
| 6 | 联调测试 | 2h | 🔄 |
| **总计** | | **14h** | |

---

## 8. 联调说明

### 前端环境变量
```env
VITE_API_BASE_URL=http://localhost:62345
VITE_AUTH_TOKEN_KEY=copilot_token
```

### 前端 API 封装
```typescript
// src/api/index.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL

// 自动携带 Token
async function request(url, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY)
  return fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
      ...options.headers,
    }
  })
}
```

---

_文档版本: v1.0_  
_更新日期: 2026-03-23_  
_状态: 待开发_