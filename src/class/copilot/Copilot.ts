import { IdCreator } from "@/interface/abstract";
import { Application } from "@/interface/app";
import { IStorage } from "@/interface/storage";
import { Router } from "@/interface/Router";
import { MemStorage } from "@/interface/storage/MemStorage";
import { Context } from "@/interface/context";
import { IMessage } from "@/interface/messages";
import { BreakError, CopilotError } from "@/interface/errors";
import { MessageFactory } from "@/interface/messages/factory";
import { IServer } from "@/interface/network";
import { Session } from "@/interface/session";
export interface CopilotConfig extends IdCreator {
  storage?: IStorage;
}

/**
 * Copilot 实例
 * @example
 * ```ts
 * // 创建 Copilot 实例
 * const copilot = new Copilot({...});
 * // 注册应用
 * copilot.registerApplication(app);
 * // 挂载到服务器
 * copilot.attach(server)
 * ```
 */
export class Copilot {
  private storage: IStorage;

  private appMap = new Map<string, Application>();

  private middlewares: ((context: Context) => Promise<void>)[] = [];

  private get routers(): Record<string, Router> {
    const apps = [...this.appMap.values()];
    return apps.reduce((routers, app) => {
      routers[app.appId] = app.router;
      return routers;
    }, {} as Record<string, Router>);
  }

  constructor(private config: CopilotConfig) {
    this.storage = config.storage || new MemStorage();
  }

  /**
   * @deprecated 使用 registerApplication  替代
   * @param app
   * @param router
   */
  setRouter(app: string, router: Router) {
    this.routers[app] = router;
  }

  registerApplication(app: Application) {
    this.appMap.set(app.appId, app);
  }

  /**
   * context初始化的时候执行
   * @param middleware
   */
  onContextInitialized(middleware: (context: Context) => Promise<void>) {
    this.middlewares.push(middleware);
  }

  /**
   * 通过 error 创建错误消息
   * @param error
   * @returns
   */
  private createErrorMessage(error: unknown): IMessage | null {
    if (error instanceof BreakError) {
      return null;
    }

    if (error instanceof CopilotError) {
      return MessageFactory.system(error.message, {
        extra: { ...error.options, code: error.code },
      });
    }

    if (error instanceof Error) {
      return MessageFactory.system("系统繁忙，请稍后再试", {
        extra: { stack: error.stack, message: error.message, code: "500" },
      });
    }

    return null;
  }

  private async executeMiddlewares(context: Context) {
    for (const middleware of this.middlewares) {
      await middleware(context);
    }
  }

  attach(server: IServer) {
    server.onPayload(async (payload, socket, session?: Session) => {
      const application = this.appMap.get(payload.app);
      if (!application) throw new Error(`No application for app ${payload.app}`);
      const router = application.router;
      if (!router) throw new Error(`No router for app ${payload.app}`);
      const context = new Context({
        payload: payload,
        socket: socket,
        session:
          session ||
          new Session({
            storage: this.storage,
            sessionId: payload.sessionId || socket.id,
            app: payload.app || "default",
            userId: payload.data.fromUser || payload.userId,
            dialogueId: payload.data.dialogueId || payload.dialogueId,
            createId: this.config.createId,
          }),
        application,
        createId: this.config.createId,
      });
      try {
        // 从存储中加载上下文
        await context.load();
        // 执行中间件
        await this.executeMiddlewares(context);
        // 初始化上下文
        await router.execute(context);
      } catch (err) {
        const msg = this.createErrorMessage(err);
        if (msg) {
          context.reply(msg);
        }
      } finally {
        const intent = context.intent;
        const histories = context.histories;
        histories.push({
          intent: String(intent),
          formName: context.formName,
          agent: context.agent?.agentId,
        });
        context.setHistories(histories);
        await context.save();
      }
    })
  }

}