export interface AnalyzeImageResult {
  description: string;
  objects: string[];
  confidence: number;
}

export async function analyzeImageTool(imageUrl: string): Promise<AnalyzeImageResult> {
  // 简化实现：返回 mock 数据
  // 实际项目中这里会调用图像识别 API
  return {
    description: `图片分析结果：${imageUrl}`,
    objects: ['object1', 'object2'],
    confidence: 0.95,
  };
}
