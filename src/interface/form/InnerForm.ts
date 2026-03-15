import type { Context } from "../context";
import type { IFormConfig } from "./Form";
export declare class InnerForm<T = any, R = unknown> {
  private formConfig;
  private context;
  constructor(formConfig: IFormConfig<T, R>, context: Context);
  /**
   * 获取表单值
   * @returns
   */
  getValues(): T;
  /**
   * 校验表单，error 为 undefined 时，校验成功
   * @returns
   */
  validate(): Promise<{
    error?: Error;
  }>;
  /**
   * 清空表单，在FormConfig中需要预先定义
   */
  clear(): void;
  /**
   * 提交表单
   * @returns
   */
  submit(): Promise<R>;
}
