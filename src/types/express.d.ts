import { IUser } from "../modules/user.model";
import { Server } from "socket.io";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      requestId?: string;
      apiVersion?: string;
      pagination?: {
        page: number;
        limit: number;
        skip: number;
        sortBy: string;
        sortOrder: 'asc' | 'desc';
      };
    }
    interface Application {
      get(setting: "io"): Server;
      set(setting: "io", value: Server): Application;
    }
  }
}

export {};
