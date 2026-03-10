import { Copilot } from './core/Copilot';
import { assistantApp } from './apps/assistant';

// 创建 Copilot 实例
const copilot = new Copilot();

// 注册应用
copilot.registerApplication(assistantApp);

export default copilot;
