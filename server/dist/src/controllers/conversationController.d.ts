import type { Request, Response } from "express";
export declare const getOrCreateConversation: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getUserConversations: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getGlobalChat: (_: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=conversationController.d.ts.map