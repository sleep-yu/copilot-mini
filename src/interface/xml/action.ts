interface Entity {
  // 实体名称
  name: string;
  // 实体值
  value: any;
  // 实体在文本中的位置
  offset?: {
    start: number;
    end: number;
  };
}

interface INLU {
  /**
   * @deprecated 已废弃，请使用agentId
   */
  agentName?: string;
  agentId?: string;
  intent?: string | symbol;
  entities?: Entity[];
  slots?: Record<string, string>;
}

interface IActionBase {
  text: string;
  type: "nlu" | "command";
  iconUrl?: string;
  theme?: "primary" | "secondary";
}

interface INluAction extends IActionBase {
  type: "nlu";
  nlu?: INLU;
}

interface ICommandAction extends IActionBase {
  type: "command";
  command: string;
  params?: any;
}

export type IAction = INluAction | ICommandAction;
