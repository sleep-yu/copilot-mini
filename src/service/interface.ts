/**
 * 服务层公共接口定义
 * 对应原项目：src/service/interface.ts
 *
 * 原项目定义了询价相关数据结构（需求列表、译码结果等）
 * 这里保留核心接口，去掉对业务 API 的强依赖
 */

/** 询价需求条目 */
export interface INeedDecodeItem {
  /** 需求 ID */
  needId: string;
  /** 需求名称（配件名） */
  needsName: string;
  /** 译码结果 ID（可选，匹配到 VIN 时才有） */
  decodeResultId?: string;
  /** 译码后的配件名称 */
  partsName?: string;
}

/** 获取需求和译码列表的返回结构 */
export interface IGetNeedDecodeListRes {
  /** 需求+译码展平列表 */
  needDecodeList: INeedDecodeItem[];
  /** 去重后的需求名称列表 */
  needsNames: string[];
  /** 译码后的配件名称列表（已匹配 VIN） */
  decodeNames: string[];
}

/** 询价单基本信息 */
export interface IInquiryInfo {
  inquiryId: string;
  status: string;
  createdAt: number;
}

/** 通用服务基类接口 */
export interface IService {
  readonly serviceName: string;
}
