export const imageIntents = {
  // 询价图片，vin或配件图
  inquiryImage: "@INQUIRY-IMAGE",
  // 通用图片
  classifyImage: "@IMAGE-CLASSIFY",
  // 轮胎图片
  tyreImage: "@IMAGE-TYRE",
  // 工单图片
  checklistImage: "@IMAGE-CHECKLIST",
  // 铭牌图、车头图、车尾图
  carInfoImage: "@IMAGE-CARINFO",
};

/** 可修改的场景 */
export const inquiryUpdateFields = {
  partNames: "partNames",
  inquiryInfo: "inquiryInfo",
  qualities: "qualities",
};

// 指令
export const commandIntents = {
  // 开启会话
  inquiryStart: "INQUIRY-START",
  // 选择/拍摄照片
  inquiryPicture: "INQUIRY-PICTURE",
  // 修改
  inquiryUpdateField: "INQUIRY-UPDATE-FIELD",
  // 点击立即询价
  inquiryPressSubmitForm: "INQUIRY-PRESS-SUBMIT-FORM",
  // 立即询价-创建询价单
  inquirySubmitForm: "INQUIRY-SUBMIT-FORM",
  // vin多品牌选择
  inquirySelectBrand: "INQUIRY-SELECT-BRAND",
  // 查看询价单
  VIEW_INQUIRY: "CHECK-INQUIRY",
  /** 更新报价信息 */
  inquiryQuote: "INQUIRY-QUOTE",
  /** 查看更多报价 */
  inquiryMoreQuotes: "INQUIRY-MORE-QUOTES",
  /** 前端获取服务器时间,时间差 */
  diffStamp: "DIFF-STAMP",
  /** 维护地址 */
  inquiryAddress: "INQUIRY-ADDRESS",
  // 识别配件图片&工单识别图片
  recognizePartsImage: "RECOGNIZE-PARTS-IMAGE",
  // 识别到工单 5.8 之后添加的类型
  recognizeChecklistImage: "RECOGNIZE-CHECKLIST-IMAGE",
  // 识别轮胎图片
  recognizeTyreImage: "RECOGNIZE-TYRE-IMAGE",
  // 识别VIN码&铭牌图片
  recognizeVinImage: "RECOGNIZE-VIN-IMAGE",
  // 识别图片
  recognizeImage: "IMAGE-RECOGNIZE",
  // 通用路由跳转
  commonNavigate: "COMMON-NAVIGATE",
  // 通用路由自动跳转
  commonNavigateAuto: "COMMON_NAVIGATE_AUTO",
  // 通用toast提示
  commonToast: "COMMON-TOAST",
  // 通用文本填充并发送
  commonTxtSend: "COMMON-TXT-SEND",
  // 更新流式消息
  pollingStreamMsg: "POLLING-STREAM-MSG",
  // 选择发票状态
  selectInvoiceStatus: "SELECT-INVOICE-STATUS",
  // 重新识别图片
  reRecognizeImage: "RE-RECOGNIZE-IMAGE",
  // 查看全部
  showFullContent: "SHOW-FULL-CONTENT",
  // 商品推荐
  productRecommend: "PRODUCT-RECOMMEND",
  // 询价单轮询
  inquiryPolling: "INQUIRY-POLLING",
  // 发送消息
  sendMessage: "SEND-MESSAGE",
  // 保存到本地内存
  saveStorage: "SAVE-STORAGE",
  // 异步command
  asyncCommand: "ASYNC-COMMAND",
  // 直接追加配件
  DIRECT_APPEND_PARTS: "DIRECT_APPEND_PARTS",
  // 发布询价后埋点
  TRACK_COMMAND: "TRACK_COMMAND",
  // 立即询价--新版
  IMMEDIATE_INQUIRY: "IMMEDIATE_INQUIRY",
  // 一键采购
  IMMEDIATE_PURCHASE: "IMMEDIATE_PURCHASE",
  // 查询订单
  VIEW_ORDER: "VIEW_ORDER",
  // 相似配件
  IMAGE_REC_PARTS_SIMILAR: "IMAGE_REC_PARTS_SIMILAR",
  // 选择相似配件
  IMAGE_REC_PARTS_SIMILAR_SELECTED: "IMAGE_REC_PARTS_SIMILAR_SELECTED",
  /** 查看方案详情 */
  VIEW_PLAN_DETAIL: "VIEW_PLAN_DETAIL",
  /** AI推荐方案 */
  AI_PURCHASE_RECOMMEND: "AI_PURCHASE_RECOMMEND",
  /** 配件勾选修改 */
  ACCIDENT_TOGGLE_PARTS: "ACCIDENT_TOGGLE_PARTS",
  // 代理询价初始化
  PROXY_INQUIRY_INITIALIZE: "PROXY_INQUIRY_INITIALIZE",
  // 代理询价解析聊天记录
  PROXY_MESSAGE_PARSE: "PROXY_MESSAGE_PARSE",
  // 复制询价单
  COPY_INQUIRY: "COPY_INQUIRY",
  // 分享维修厂
  SHARE_GARAGE: "SHARE_GARAGE",
  // 查看方案日志
  VIEW_PLAN_LOG: "VIEW_PLAN_LOG",
  // 车辆图片：铭牌、车头、车尾
  IMAGE_CAR_INFO_IMAGES: "IMAGE_CAR_INFO_IMAGES",
  // 修改发票
  CHANGE_INVOICE: "CHANGE_INVOICE",
  // 用户反馈
  USER_FEEDBACK: "USER_FEEDBACK",
  // 支付完成跳转到AI采购助手
  PAY_COMPLETE: "PAY_COMPLETE",
  /** 查看微信方案 */
  VIEW_WECHAT_PLAN: "VIEW_WECHAT_PLAN",
};

// nlu按钮的意图
export const NluActionIntents = {
  ROTATE_IMAGE: "ROTATE_IMAGE",
  IMAGE_REC_PARTS_SIMILAR_NO: "IMAGE_REC_PARTS_SIMILAR_NO",
  /** 误识别短车架号 */
  NOT_SHORT_VINCODE: "NOT_SHORT_VINCODE",
  /** 修改方案 */
  MODIFY_PLAN: "MODIFY_PLAN",
  /** 保存方案 */
  INQUIRY_PLAN_SAVE: "INQUIRY_PLAN_SAVE",
  /** 没有想要的配件 */
  NO_WANT_PARTS: "NO_WANT_PARTS",
  /** 用户点击"追加配件"按钮 */
  APPEND_PARTS: "APPEND_PARTS",
  /** 重新询价 */
  RE_INQUIRY: "RE_INQUIRY",
  /** 基于指定询价单追加配件 */
  APPEND_PARTS_FROM_INQUIRY: "APPEND_PARTS_FROM_INQUIRY",
  /** 没有想要的配件 */
  NO_NEED_PART_NAME: "NO_NEED_PART_NAME",
  /** 不知道选哪个配件 */
  NO_PART_NAME_SELECTED: "NO_PART_NAME_SELECTED",
};

// command按钮的意图
export const CommandActionIntents = {
  FILL_INPUT_TEXT: "FILL-INPUT-TEXT", // 回填消息
  ECHO_COMMAND: "ECHO-COMMAND", // 回传command
  /** 轮胎报价一键采购 */
  IMMEDIATE_PURCHASE_TYRE: "IMMEDIATE_PURCHASE_TYRE",
  /** 跳转 epc */
  GO_TO_EPC: "GO_TO_EPC",
  /** 复制询价单 */
  COPY_TEXT: "COPY_TEXT",
  /** 弹起输入框 */
  FOCUS_INPUT_BOX: "FOCUS_INPUT_BOX",
  /** 指定询价设置 */
  ASSIGN_INQUIRY_SETTING: "ASSIGN_INQUIRY_SETTING",
};

export const NluIntents = {
  EPC_APPEND_PARTS: "EPC_APPEND_PARTS", // epc追加配件
  SCAN_VIN: "SCAN_VIN", // 扫VIN码
  /** 指定询价设置 */
  ASSIGN_INQUIRY_SETTING: "ASSIGN_INQUIRY_SETTING",
};

/**
 * @deprecated 用 InquiryIntents 替代
 * 意图
 */
export const Intents = {
  inquiry: "inquiry",
  // 发起新单
  newInquiry: "newInquiry",
  cancel: "cancel",
  confirm: "confirm",
  greet: "greet",
  bye: "bye",
  edit: "edit",
  replace: "replace",
  add: "add",
  delete: "delete",
  fallback: "fallback",
  人工客服: "人工客服",
  重新开始: "重新开始",
  需要发票: "需要发票",
  不需要发票: "不需要发票",
  ...commandIntents,
  ...imageIntents,
} as const;

export type IntentKey = keyof typeof Intents;

// IM-TeamId类型
export const IMTeamId = {
};

/**
 * ORIGINAL_BRAND 原厂
 * BRAND  品牌
 * ORIGINAL_OTHERS  原厂再制造
 * SECOND_HAND  拆车件
 * OTHER_BRAND  其他
 */
export const qualities: { [key: string]: string } = {

};
// 品质类型
export const IQuality: { [key: string]: string } = {
  ORIGINAL_OTHERS: "原厂再制造件",
  ORIGINAL_BRAND: "原厂件",
  BRAND: "品牌件",
  SECOND_HAND: "拆车件",
  OTHER_BRAND: "其他",
};
