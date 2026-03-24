/**
 * API 自动化测试模板
 * 使用方法: Jest + node-fetch 或 Vitest
 * 
 * 运行方式:
 *   npx jest api.test.ts --config jest.config.js
 *   或
 *   npx vitest run api.test.ts
 */

import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals'

const BASE_URL = 'http://localhost:62345'

// ==========================================
// 辅助函数
// ==========================================

async function apiRequest(
  path: string,
  options: RequestInit = {},
  token?: string
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  let body
  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    body = await response.json()
  } else {
    body = await response.text()
  }

  return { status: response.status, data: body }
}

// ==========================================
// 全局 Setup / Teardown
// ==========================================

let globalToken: string
const TEST_EMAIL = `qa_${Date.now()}@example.com`
const TEST_PASSWORD = 'Test@123456'

// ==========================================
// 模块 1: 认证 API
// ==========================================

describe('【认证模块】POST /api/auth/register', () => {
  test('TC-API-AUTH-001: 注册成功', async () => {
    const { status, data } = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    })
    expect(status).toBeGreaterThanOrEqual(200)
    expect(status).toBeLessThan(300)
    expect(data.code).toBe(0)
    expect(data.data.email).toBe(TEST_EMAIL)
  })

  test('TC-API-AUTH-002: 邮箱已注册 (409 or 400)', async () => {
    const { status, data } = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    })
    expect([400, 409]).toContain(status)
    expect(data.code).not.toBe(0)
  })

  test('TC-API-AUTH-003: 缺少必填字段', async () => {
    const { status } = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'some@email.com' }), // 缺少 password
    })
    expect([400, 422]).toContain(status)
  })

  test('TC-API-AUTH-004: 密码过短 (< 6 位)', async () => {
    const { status } = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'short@email.com', password: '123' }),
    })
    expect([400, 422]).toContain(status)
  })
})

describe('【认证模块】POST /api/auth/login', () => {
  beforeAll(async () => {
    // 确保测试账号存在
    await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    })
  })

  test('TC-API-AUTH-005: 登录成功，返回 token', async () => {
    const { status, data } = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    })
    expect(status).toBe(200)
    expect(data.code).toBe(0)
    expect(data.data.token).toBeDefined()
    expect(typeof data.data.token).toBe('string')
    globalToken = data.data.token
  })

  test('TC-API-AUTH-006: 密码错误 (401 or 400)', async () => {
    const { status, data } = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: TEST_EMAIL, password: 'WrongPassword!' }),
    })
    expect([400, 401]).toContain(status)
    expect(data.code).not.toBe(0)
  })

  test('TC-API-AUTH-007: 账号不存在', async () => {
    const { status, data } = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'not_exist_999@example.com', password: TEST_PASSWORD }),
    })
    expect([400, 401, 404]).toContain(status)
    expect(data.code).not.toBe(0)
  })
})

describe('【认证模块】GET /api/auth/me', () => {
  test('TC-API-AUTH-008: 有效 Token 获取用户信息', async () => {
    // 先登录获取 token
    await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: `me_test_${Date.now()}@example.com`, password: TEST_PASSWORD }),
    })
    const loginRes = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: `me_test_${Date.now()}@example.com`, password: TEST_PASSWORD }),
    })
    const token = loginRes.data.data.token

    const { status, data } = await apiRequest('/api/auth/me', {}, token)
    expect(status).toBe(200)
    expect(data.code).toBe(0)
    expect(data.data.email).toBeDefined()
  })

  test('TC-API-AUTH-009: 无 Token (401)', async () => {
    const { status } = await apiRequest('/api/auth/me')
    expect([401, 403]).toContain(status)
  })

  test('TC-API-AUTH-010: 无效 Token (401)', async () => {
    const { status } = await apiRequest('/api/auth/me', {}, 'invalid.fake.token')
    expect([401, 403]).toContain(status)
  })
})

describe('【认证模块】POST /api/auth/logout', () => {
  test('TC-API-AUTH-011: 登出后 Token 失效', async () => {
    // 注册并登录
    const email = `logout_${Date.now()}@example.com`
    await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password: TEST_PASSWORD }),
    })
    const { data: loginData } = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: TEST_PASSWORD }),
    })
    const token = loginData.data.token

    // 登出
    const logoutRes = await apiRequest('/api/auth/logout', { method: 'POST' }, token)
    expect(logoutRes.status).toBe(200)

    // Token 应失效
    const meRes = await apiRequest('/api/auth/me', {}, token)
    expect([401, 403]).toContain(meRes.status)
  })
})

// ==========================================
// 模块 2: 会话 API
// ==========================================

describe('【会话模块】GET /api/sessions', () => {
  let token: string

  beforeAll(async () => {
    const email = `session_${Date.now()}@example.com`
    await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password: TEST_PASSWORD }),
    })
    const { data } = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: TEST_PASSWORD }),
    })
    token = data.data.token
  })

  test('TC-API-SESSION-001: 获取会话列表 (200)', async () => {
    const { status, data } = await apiRequest('/api/sessions?page=1&pageSize=20', {}, token)
    expect(status).toBe(200)
    expect(data.code).toBe(0)
    expect(Array.isArray(data.data.sessions)).toBe(true)
    expect(data.data.pagination).toBeDefined()
  })

  test('TC-API-SESSION-002: 无效分页参数 (400)', async () => {
    const { status } = await apiRequest('/api/sessions?page=-1', {}, token)
    expect([400, 422]).toContain(status)
  })
})

describe('【会话模块】POST /api/sessions', () => {
  let token: string

  beforeAll(async () => {
    const email = `create_session_${Date.now()}@example.com`
    await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password: TEST_PASSWORD }),
    })
    const { data } = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: TEST_PASSWORD }),
    })
    token = data.data.token
  })

  test('TC-API-SESSION-003: 创建会话（带标题）', async () => {
    const { status, data } = await apiRequest('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ title: '测试会话标题' }),
    }, token)
    expect(status).toBeGreaterThanOrEqual(200)
    expect(status).toBeLessThan(300)
    expect(data.code).toBe(0)
    expect(data.data.id).toBeDefined()
    expect(data.data.title).toBe('测试会话标题')
  })

  test('TC-API-SESSION-004: 创建会话（不带标题）', async () => {
    const { status, data } = await apiRequest('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({}),
    }, token)
    expect(status).toBeGreaterThanOrEqual(200)
    expect(status).toBeLessThan(300)
    expect(data.code).toBe(0)
    expect(data.data.id).toBeDefined()
  })

  test('TC-API-SESSION-005: 未登录创建会话 (401)', async () => {
    const { status } = await apiRequest('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ title: 'test' }),
    })
    expect([401, 403]).toContain(status)
  })
})

describe('【会话模块】GET /api/sessions/:id', () => {
  let token: string
  let sessionId: string

  beforeAll(async () => {
    const email = `get_session_${Date.now()}@example.com`
    await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password: TEST_PASSWORD }),
    })
    const { data: loginData } = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: TEST_PASSWORD }),
    })
    token = loginData.data.token

    const { data: createData } = await apiRequest('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ title: '详情测试' }),
    }, token)
    sessionId = createData.data.id
  })

  test('TC-API-SESSION-006: 获取会话详情', async () => {
    const { status, data } = await apiRequest(`/api/sessions/${sessionId}`, {}, token)
    expect(status).toBe(200)
    expect(data.code).toBe(0)
    expect(data.data.id).toBe(sessionId)
    expect(Array.isArray(data.data.messages)).toBe(true)
  })

  test('TC-API-SESSION-007: 获取不存在的会话 (404)', async () => {
    const { status } = await apiRequest('/api/sessions/nonexistent999', {}, token)
    expect([400, 404]).toContain(status)
  })
})

describe('【会话模块】PUT /api/sessions/:id', () => {
  let token: string
  let sessionId: string

  beforeEach(async () => {
    const email = `put_session_${Date.now()}@example.com`
    await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password: TEST_PASSWORD }),
    })
    const { data: loginData } = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: TEST_PASSWORD }),
    })
    token = loginData.data.token

    const { data: createData } = await apiRequest('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ title: '原始标题' }),
    }, token)
    sessionId = createData.data.id
  })

  test('TC-API-SESSION-008: 更新会话标题', async () => {
    const { status } = await apiRequest(`/api/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify({ title: '更新后的标题' }),
    }, token)
    expect(status).toBe(200)

    // 验证
    const { data: getData } = await apiRequest(`/api/sessions/${sessionId}`, {}, token)
    expect(getData.data.title).toBe('更新后的标题')
  })
})

describe('【会话模块】DELETE /api/sessions/:id', () => {
  let token: string
  let sessionId: string

  beforeEach(async () => {
    const email = `del_session_${Date.now()}@example.com`
    await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password: TEST_PASSWORD }),
    })
    const { data: loginData } = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: TEST_PASSWORD }),
    })
    token = loginData.data.token

    const { data: createData } = await apiRequest('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ title: '待删除' }),
    }, token)
    sessionId = createData.data.id
  })

  test('TC-API-SESSION-009: 删除会话 (200)', async () => {
    const { status } = await apiRequest(`/api/sessions/${sessionId}`, {
      method: 'DELETE',
    }, token)
    expect(status).toBe(200)

    // 验证已删除
    const getRes = await apiRequest(`/api/sessions/${sessionId}`, {}, token)
    expect([400, 404]).toContain(getRes.status)
  })
})

// ==========================================
// 模块 3: 消息 API
// ==========================================

describe('【消息模块】POST /api/sessions/:id/messages', () => {
  let token: string
  let sessionId: string

  beforeAll(async () => {
    const email = `msg_${Date.now()}@example.com`
    await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password: TEST_PASSWORD }),
    })
    const { data: loginData } = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: TEST_PASSWORD }),
    })
    token = loginData.data.token

    const { data: createData } = await apiRequest('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ title: '消息测试' }),
    }, token)
    sessionId = createData.data.id
  })

  test('TC-API-MSG-001: 发送用户消息', async () => {
    const { status, data } = await apiRequest(
      `/api/sessions/${sessionId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ role: 'user', content: '你好，这是测试消息' }),
      },
      token
    )
    expect(status).toBe(200)
    expect(data.code).toBe(0)
    expect(data.data.role).toBe('user')
    expect(data.data.content).toBe('你好，这是测试消息')
  })

  test('TC-API-MSG-002: 非法 role 字段 (400)', async () => {
    const { status } = await apiRequest(
      `/api/sessions/${sessionId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ role: 'admin', content: '非法角色' }),
      },
      token
    )
    expect([400, 422]).toContain(status)
  })

  test('TC-API-MSG-003: 空 content (400)', async () => {
    const { status } = await apiRequest(
      `/api/sessions/${sessionId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ role: 'user', content: '' }),
      },
      token
    )
    expect([400, 422]).toContain(status)
  })
})

describe('【消息模块】DELETE /api/sessions/:id/messages', () => {
  let token: string
  let sessionId: string

  beforeAll(async () => {
    const email = `del_msg_${Date.now()}@example.com`
    await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password: TEST_PASSWORD }),
    })
    const { data: loginData } = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: TEST_PASSWORD }),
    })
    token = loginData.data.token

    const { data: createData } = await apiRequest('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ title: '清空消息测试' }),
    }, token)
    sessionId = createData.data.id
  })

  test('TC-API-MSG-004: 清空会话消息', async () => {
    // 先发一条消息
    await apiRequest(
      `/api/sessions/${sessionId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ role: 'user', content: '待清空的消息' }),
      },
      token
    )

    // 清空
    const { status } = await apiRequest(
      `/api/sessions/${sessionId}/messages`,
      { method: 'DELETE' },
      token
    )
    expect(status).toBe(200)

    // 验证
    const { data: getData } = await apiRequest(`/api/sessions/${sessionId}`, {}, token)
    expect(getData.data.messages.length).toBe(0)
  })
})

// ==========================================
// 模块 4: Copilot Hook API
// ==========================================

describe('【Copilot Hook】POST /copilot/hook', () => {
  test('TC-API-COPILOT-001: 发送文本消息', async () => {
    const { status, data } = await apiRequest('/copilot/hook', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: `test-session-${Date.now()}`,
        data: {
          fromUser: 'user_001',
          type: 'text',
          content: '你好，请介绍一下你自己',
        },
      }),
    })
    expect(status).toBe(200)
    expect(data.data).toBeDefined()
  })

  test('TC-API-COPILOT-002: 缺少 content 字段', async () => {
    const { status } = await apiRequest('/copilot/hook', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'test-session',
        data: { fromUser: 'user_001', type: 'text' },
      }),
    })
    expect([400, 422]).toContain(status)
  })

  test('TC-API-COPILOT-003: 缺少 sessionId', async () => {
    const { status } = await apiRequest('/copilot/hook', {
      method: 'POST',
      body: JSON.stringify({
        data: { fromUser: 'user_001', type: 'text', content: 'test' },
      }),
    })
    expect([400, 422]).toContain(status)
  })
})

// ==========================================
// 模块 5: 健康检查
// ==========================================

describe('【系统】GET /health', () => {
  test('TC-API-HEALTH-001: 健康检查接口', async () => {
    const { status, data } = await apiRequest('/health')
    expect(status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data.uptime).toBeDefined()
  })
})
