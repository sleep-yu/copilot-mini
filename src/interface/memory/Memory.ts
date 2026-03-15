import type { Entity } from "../entity";
import { SlotConfig, SlotRecords } from "../slots";
import { IClassifierConfig } from "../agent/Classifier";
export interface SlotChanged {
  changed: boolean;
  before: any;
  after: any;
}
type SlotsCfg = Record<string, Omit<SlotConfig, "filling">>;
export interface IMemoryOptions {
  agentId?: string;
  /**
   * @deprecated 请使用agentId
   */
  agentName?: string;
  intent?: string;
  formName?: string;
  entities?: Entity[];
  slots?: SlotRecords;
  extra?: Record<string, any>;
  preClassifierConfig?: IClassifierConfig;
  slotsConfig?: SlotsCfg;
}
export declare class Memory {
  /**
   * @deprecated 请使用agentId
   * agent名称
   */
  agentName?: string;
  agentId?: string;
  /**
   * 意图
   */
  intent?: string | symbol;
  /**
   * 表单名称
   */
  formName?: string;
  /**
   * 实体记录
   */
  entities?: Entity[];
  /**
   * 前置分类器
   */
  preClassifierConfig?: IClassifierConfig;
  /**
   * 槽位记录
   */
  slots: SlotRecords;
  private initSlots;
  /**
   * 槽变化情况
   */
  slotsChanges: Record<string, SlotChanged>;
  /**
   * 扩展字段
   */
  extra: Record<string, any>;
  slotsConfig?: SlotsCfg;
  constructor({ agentId, agentName, intent, formName, entities, slots, extra, slotsConfig, preClassifierConfig, }?: IMemoryOptions);
  /**
   * 临时数据,不会被持久化
   */
  tempData: Record<string, unknown>;
  /**
   * 设置临时数据
   * @param key
   * @param value
   */
  setTempData(key: string, value: unknown): void;
  getTempData(key: string): unknown;
  /**
   * 取出前置分类器，并清空
   * @returns
   */
  takePreClassifierConfig(): IClassifierConfig | undefined;
  setPreClassifierConfig(classifier: IClassifierConfig): void;
  setIntent(intent: string | symbol): void;
  setFormName(formName: string): void;
  setAgentId(agentId: string): void;
  setEntities(entities: Entity[]): void;
  setSlots(slots: SlotRecords): void;
  rollbackSlots(): void;
  setSlotsConfig(slotsConfig: SlotsCfg): void;
  private getChanges;
  setExtra(key: string, value: any): void;
  clearExtra(): void;
  persistenceObject(): {
    agentName: string | undefined;
    agentId: string | undefined;
    formName: string | undefined;
    slots: SlotRecords;
    extra: Record<string, any>;
    slotsConfig: SlotsCfg | undefined;
    preClassifierConfig: IClassifierConfig | undefined;
  };
  toObject(): {
    agentName: string | undefined;
    agentId: string | undefined;
    intent: string | symbol | undefined;
    formName: string | undefined;
    entities: Entity[] | undefined;
    slots: SlotRecords;
    extra: Record<string, any>;
    preClassifierConfig: IClassifierConfig | undefined;
  };
}
export { };
