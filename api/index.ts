import { Request, Response } from 'express';

import serverModule from '../dist/server.cjs';

export default async (req: Request, res: Response) => {
  try {
    const appPromise = serverModule.default || serverModule.appPromise || serverModule;
    const app = await appPromise;
    return app(req, res);
  } catch (error: any) {
    console.error("Vercel Serverless Function Runtime Crash:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
