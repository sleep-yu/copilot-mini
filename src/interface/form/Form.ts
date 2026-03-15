import type { Context } from "../context";
import type { SlotRecords } from "../slots";
type FormData = Record<string, any>;
export interface IFormConfig<T = FormData, R = any> {
  /**
   * 表单映射方法，slots -> formData
   * @param slots
   * @param context
   */
  doMapping(slots: SlotRecords, context: Context): T;
  /**
   * 表单校验方法，如果不通过，请抛异常
   * @param formData
   * @param context
   */
  doValidate?(formData: T, context: Context): Promise<void> | void;
  /**
   * 表单提交方法
   * @param formData
   * @param context
   * @returns 提交表单返回的结果
   */
  doSubmit(formData: T, context: Context): Promise<R>;
  /**
   * 清空表单
   */
  doClear?(context: Context): void;
}
export declare abstract class Form<T = FormData, R = any> implements IFormConfig<T, R> {
  protected context: Context;
  constructor(context: Context);
  abstract doMapping(slots: SlotRecords, context: Context): T;
  abstract doValidate?(formData: T, context: Context): Promise<void> | void;
  abstract doSubmit(formData: T, context: Context): Promise<R>;
  abstract doClear?(context: Context): void;
}
export { };
