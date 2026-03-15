import type { Context } from "../context";
import { IFormConfig } from "./Form";
type FormConfigClass = new (context: Context) => IFormConfig;
export type FormConfig = IFormConfig | FormConfigClass;
export { };
