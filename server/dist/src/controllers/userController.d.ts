import type { Request, Response } from "express";
export declare const getAllUsers: (_: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getUserById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const searchUsers: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateAvatar: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=userController.d.ts.map