import { Request } from 'express';

export interface AuthRequest extends Request {
  user: { id: string };
  headers: any;
  params: any;
  body: any;
}
