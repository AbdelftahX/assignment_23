import { Request } from 'express';
import { UserDocument } from '../../auth/schemas/user.schema';

export interface AuthenticatedRequest extends Request {
  user: UserDocument;
}
