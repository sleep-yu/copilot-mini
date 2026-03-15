import type { Entity } from "../entity";
import type { Context } from "../context";
import type { PromiseOrNot } from "../helpers";
export type SlotRecords = Record<string, any>;
export interface SlotConfig {
  /**
   * 槽自动填充方法
   * @param entities
   * @param context
   */
  filling?(entities: Entity[], context: Context): PromiseOrNot<any>;
  /**
   * 槽对应的生命周期， session: 会话期间有效，forever: 永久有效，默认session
   */
  lifetime?: "session" | "forever";
}
