import bcrypt from "bcrypt";
import { User } from "../model/User";
import { generateToken } from "../middleware/auth";

const SALT_ROUNDS = 10;

export interface RegisterDto {
  email: string;
  password: string;
  nickname?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export const authService = {
  async register(dto: RegisterDto) {
    const { email, password, nickname } = dto;

    const existing = await User.findOne({ email });
    if (existing) {
      return { ok: false, error: "邮箱已存在" } as const;
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      email,
      password: hashedPassword,
      nickname: nickname || "",
    });

    // 注册成功后直接生成 token，实现自动登录
    const token = generateToken({ userId: user._id.toString(), email: user.email });

    return {
      ok: true,
      data: {
        userId: user._id.toString(),
        email: user.email,
        nickname: user.nickname,
        token,  // 返回 token，前端可直接使用
      },
    } as const;
  },

  async login(dto: LoginDto) {
    const { email, password } = dto;

    const user = await User.findOne({ email });
    if (!user) {
      return { ok: false, error: "邮箱或密码错误" } as const;
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return { ok: false, error: "邮箱或密码错误" } as const;
    }

    const token = generateToken({ userId: user._id.toString(), email: user.email });

    return {
      ok: true,
      data: {
        token,
        user: {
          userId: user._id.toString(),
          email: user.email,
          nickname: user.nickname,
        },
      },
    } as const;
  },

  async getCurrentUser(userId: string) {
    const user = await User.findById(userId).select("email nickname avatar");
    if (!user) {
      return { ok: false, error: "用户不存在" } as const;
    }

    return {
      ok: true,
      data: {
        userId: user._id.toString(),
        email: user.email,
        nickname: user.nickname,
      },
    } as const;
  },
};
