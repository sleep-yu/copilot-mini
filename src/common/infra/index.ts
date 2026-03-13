/**
 * 基础设施层 - 占位模块
 * 对应原项目：src/common/infra/
 *
 * 原项目此处实现了 Eureka 服务注册与发现（微服务架构）
 * mini 版本不需要微服务注册中心，此文件仅作占位说明
 *
 * 原项目结构：
 *   - eureka.ts: 封装 @casstime/eureka 客户端，用于服务注册
 *   - fetch-event-source/: SSE 流式请求封装
 *
 * mini 版本：
 *   - 单体应用，无需 Eureka
 *   - SSE 已在 common/clients/http.client.ts 实现
 */

// 占位导出，避免空模块
export const INFRA_PLACEHOLDER = "mini 版本无需微服务基础设施";
