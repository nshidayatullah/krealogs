import { Request, Response } from 'express';

// Enable global error catch to log unhandled promise rejections as well
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default async (req: Request, res: Response) => {
  try {
    console.log("Starting serverless execution for route:", req.url);
    
    // Dynamically import server.ts to catch any initialization or module resolution errors
    const serverModule = await import('../server');
    const app = await serverModule.appPromise;
    
    return app(req, res);
  } catch (error: any) {
    console.error("Vercel Serverless Function Crash caught in wrapper:", error);
    res.status(500).json({
      error: "Vercel Serverless Function Crash",
      message: error.message,
      stack: error.stack,
      env_db_set: !!process.env.DATABASE_URL
    });
  }
};
