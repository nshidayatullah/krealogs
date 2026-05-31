import { Request, Response } from 'express';
import appPromise from '../server';

export default async (req: Request, res: Response) => {
  try {
    const app = await appPromise;
    return app(req, res);
  } catch (error: any) {
    console.error("Vercel Serverless Function Crash:", error);
    res.status(500).json({
      error: "Vercel Serverless Function Crash",
      message: error.message,
      stack: error.stack
    });
  }
};

