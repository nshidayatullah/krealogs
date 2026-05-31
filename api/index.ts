import { Request, Response } from 'express';

// Dynamically or statically resolve pre-bundled server from dist/server.cjs
// @ts-ignore
import serverModule from '../dist/server.cjs';

export default async (req: Request, res: Response) => {
  try {
    const appPromise = serverModule.default || serverModule.appPromise || serverModule;
    const app = await appPromise;
    return app(req, res);
  } catch (error: any) {
    console.error("Vercel Serverless Function Runtime Crash:", error);
    res.status(500).json({
      error: "Vercel Serverless Function Runtime Crash",
      message: error.message,
      stack: error.stack
    });
  }
};
