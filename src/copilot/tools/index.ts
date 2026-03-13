import { analyzeImageTool } from './analyzeImageTool';

export interface ToolDefinition {
  name: string;
  description: string;
  handler: (...args: unknown[]) => Promise<unknown>;
}

export function getTools(): ToolDefinition[] {
  return [
    {
      name: 'analyzeImage',
      description: '分析图片内容，识别图中的对象和场景',
      handler: (imageUrl: unknown) => analyzeImageTool(imageUrl as string),
    },
  ];
}

export { analyzeImageTool };
