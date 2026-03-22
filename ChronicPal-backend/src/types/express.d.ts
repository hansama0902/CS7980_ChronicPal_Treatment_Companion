import { IAuthenticatedUser } from './auth';

declare global {
  namespace Express {
    interface Request {
      user?: IAuthenticatedUser;
    }
  }
}
