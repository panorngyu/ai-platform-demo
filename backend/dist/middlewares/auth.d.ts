import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: number;
                username: string;
                role: string;
                realName?: string;
            };
        }
    }
}
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare function rbacMiddleware(roles: string[]): (req: Request, res: Response, next: NextFunction) => void;
export declare function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void;
declare const _default: {
    authMiddleware: typeof authMiddleware;
    rbacMiddleware: typeof rbacMiddleware;
    errorHandler: typeof errorHandler;
};
export default _default;
