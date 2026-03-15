import type { Context } from "../context";
/**
 * 其他类别ID
 */
export declare const UNKNOWN_SYMBOL: unique symbol;
/**
 * FALLBACK类别ID
 */
export declare const FALLBACK_SYMBOL: unique symbol;
export declare const TASK_SYMBOL: unique symbol;
export type Code = string | symbol;
export interface IClassifierConfig {
  id: Code;
  params: unknown;
}
export interface IClassifier {
  id: string | symbol;
  /**
   * 分类器分类方法
   * @param context 上下文
   * @param candidates 参与分类的类别
   */
  classify(context: Context, candidates: Code[]): Promise<Code>;
}
