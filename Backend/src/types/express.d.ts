import { Request, Response, NextFunction, RequestHandler } from 'express';

declare global {
    namespace Express {
        interface User {
            id: string;
            email: string;
            role: string;
            companyId: string;
            companyType?: string;
        }
    }
}

export interface AuthenticatedRequest extends Request {
    user: Express.User;
}

export type RequestHandlerWithAuth<P = any, ResBody = any, ReqBody = any> = (
    req: AuthenticatedRequest,
    res: Response<ResBody>,
    next: NextFunction
) => void | Promise<void>;

// Type assertion helper
export const wrapHandler = (handler: RequestHandlerWithAuth): RequestHandler => 
    handler as unknown as RequestHandler;