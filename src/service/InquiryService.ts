/**
 * 询价服务
 * 对应原项目：src/service/InquiryService.ts
 *
 * 原项目调用 inquiryClient 请求后端 API，获取需求列表和译码结果
 * mini 版本保留相同的方法签名，HTTP 调用部分用占位逻辑替代
 */

import logger from "../common/logger";
import {
  IService,
  INeedDecodeItem,
  IGetNeedDecodeListRes,
} from "./interface";

export class InquiryService implements IService {
  readonly serviceName = "InquiryService";

  /**
   * 获取询价单的需求和译码列表
   * 原项目：并发调用 getUserNeedsList 和 getDecodeResultList，然后展平合并
   * @param inquiryId 询价单 ID
   */
  async getNeedDecodeList(inquiryId: string): Promise<IGetNeedDecodeListRes> {
    const needDecodeList: INeedDecodeItem[] = [];

    try {
      // 原项目这里并发请求：
      //   const [needsListRes, decodeListRes] = await Promise.all([
      //     inquiryClient.getUserNeedsList(inquiryId),
      //     inquiryClient.getDecodeResultList(inquiryId),
      //   ]);
      // mini 版本占位，返回空列表
      logger.info(`[InquiryService] getNeedDecodeList: inquiryId=${inquiryId}`);
    } catch (error) {
      logger.error("[InquiryService] 获取需求和译码列表失败", error);
    }

    const needsNames = [
      ...new Set(needDecodeList.map((item) => item.needsName)),
    ];
    const decodeNames = needDecodeList
      .map((item) => item.partsName)
      .filter((name): name is string => name !== undefined);

    return { needDecodeList, needsNames, decodeNames };
  }
}
