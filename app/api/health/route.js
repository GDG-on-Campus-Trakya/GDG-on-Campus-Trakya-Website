// API Health Check endpoint for monitoring
export const dynamic = 'force-dynamic';
export const runtime = 'edge'; // Edge runtime for faster response

export async function GET() {
  return Response.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
