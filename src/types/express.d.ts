import { IUser } from "../modules/user.model";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export {};
