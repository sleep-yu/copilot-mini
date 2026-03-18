import _ from "lodash";
import type { Entity } from "../entity";
import { SlotConfig, SlotRecords } from "../slots";
import { IClassifierConfig } from "../agent";

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

export class Memory {
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
  slots: SlotRecords = {};

  private initSlots = {};

  /**
   * 槽变化情况
   */
  slotsChanges: Record<string, SlotChanged> = {};

  /**
   * 扩展字段
   */
  extra: Record<string, any> = {};

  slotsConfig?: SlotsCfg;

  constructor({
    agentId,
    agentName,
    intent,
    formName,
    entities,
    slots,
    extra,
    slotsConfig,
    preClassifierConfig,
  }: IMemoryOptions = {}) {
    const agentIdOrName = agentId || agentName;
    this.agentName = agentIdOrName;
    this.agentId = agentIdOrName;
    this.intent = intent;
    this.formName = formName;
    this.entities = entities;
    this.slots = slots || {};
    this.initSlots = _.cloneDeep(slots || {});
    this.extra = extra || {};
    this.slotsConfig = slotsConfig;
    this.preClassifierConfig = preClassifierConfig;
  }

  /**
   * 临时数据,不会被持久化
   */
  tempData: Record<string, unknown> = {};

  /**
   * 设置临时数据
   * @param key
   * @param value
   */
  setTempData(key: string, value: unknown) {
    this.tempData[key] = value;
  }

  getTempData(key: string) {
    return this.tempData[key];
  }

  /**
   * 取出前置分类器，并清空
   * @returns
   */
  takePreClassifierConfig() {
    const classifier = this.preClassifierConfig;
    this.preClassifierConfig = undefined;
    return classifier;
  }

  setPreClassifierConfig(classifier: IClassifierConfig) {
    this.preClassifierConfig = classifier;
  }

  setIntent(intent: string | symbol) {
    this.intent = intent;
  }

  setFormName(formName: string) {
    this.formName = formName;
  }

  setAgentId(agentId: string) {
    this.agentName = agentId;
    this.agentId = agentId;
  }

  setEntities(entities: Entity[]) {
    this.entities = entities;
  }

  setSlots(slots: SlotRecords) {
    this.slotsChanges = this.getChanges(slots);
    this.slots = slots;
  }

  rollbackSlots() {
    this.slotsChanges = {};
    this.slots = _.cloneDeep(this.initSlots);
  }

  setSlotsConfig(slotsConfig: SlotsCfg) {
    this.slotsConfig = slotsConfig;
  }

  private getChanges(nextSlots: SlotRecords) {
    const changes: Record<string, SlotChanged> = this.slotsChanges;
    Object.keys(nextSlots).forEach((key) => {
      const originValue = _.has(this.slotsChanges[key], "before")
        ? _.get(this.slotsChanges[key], "before")
        : this.slots[key];
      const current = nextSlots[key];
      const changed = !_.isEqual(originValue, current);
      changes[key] = {
        changed,
        before: originValue,
        after: nextSlots[key],
      };
    });
    return changes;
  }

  setExtra(key: string, value: any) {
    this.extra[key] = value;
  }

  clearExtra() {
    this.extra = {};
  }

  persistenceObject() {
    return {
      agentName: this.agentId,
      agentId: this.agentId,
      formName: this.formName,
      slots: this.slots,
      extra: this.extra,
      slotsConfig: this.slotsConfig,
      preClassifierConfig: this.preClassifierConfig,
    };
  }

  toObject() {
    return {
      agentName: this.agentId,
      agentId: this.agentId,
      intent: this.intent,
      formName: this.formName,
      entities: this.entities,
      slots: this.slots,
      extra: this.extra,
      preClassifierConfig: this.preClassifierConfig,
    };
  }
}
