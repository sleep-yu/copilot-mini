const VersionEnum = {
  FIVE_16_0: "5.16.0",
  FIVE_17_0: "5.17.0",
  FIVE_18_0: "5.18.0",
  FIVE_19_0: "5.19.0",
  SIX_2_0: "6.2.0",
  /**
   * AI推荐添加采购弹窗功能
   */
  SIX_7_0: "6.7.0",
  /**
   * richtext中View支持showType属性onLast。只在最后一条消息展示
   */
  SIX_9_0: "6.9.0",
  MAX_VERSION: "999.999.999",
  /**
   * 所有vin码支持跳转电子目录
   */
  SIX_15_0: "6.15.0",
  /**
   * 铭牌、车头、车尾上传
   */
  SIX_15_6: "6.15.6",

  /**
   * 支持markdown组件
   */
  XML_MARKDOWN_SUPPORT: "6.16.0",
  /**
   * 支持安装说明
   */
  INSTALLATION_SUPPORT: "6.17.0",
  /**
   * 支持Block消息
   */
  BLOCK_MESSAGE_SUPPORT: "6.17.0",

  /**
   * XML支持视频组件
   */
  XML_VIDEO_SUPPORT: "6.17.0",
  /**
   * 支持渲染系统消息的版本
   */
  SYSTEM_MSG_SUPPORT: "6.17.6",
  /**
   * 支持反馈的版本
   */
  USER_FEEDBACK_SUPPORT: "6.18.0",
  /**
   * 支持配件影响页面版本
   */
  PARTS_IMPACT_PAGE_SUPPORT: "6.18.0",
  /**
   * 支持弹起键盘
   */
  FOCUS_INPUT_BOX_SUPPORT: "6.20.0",
  /**
   * 支持城市爆品
   */
  HOT_PICK: "6.20.6",
  /**
   * 支持询价设置
   */
  INQUIRY_SETTING: "6.21.0",
} as const;

type VersionEnum = (typeof VersionEnum)[keyof typeof VersionEnum];

export default VersionEnum;
