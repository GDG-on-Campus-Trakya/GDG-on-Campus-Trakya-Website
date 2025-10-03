import 'server-only';
import { NextResponse } from "next/server";
import { getFirestore } from "../../../../utils/firebaseAdmin";
import { withAuth } from "../../../../middleware/adminAuthApp";
import { logger } from "@/utils/logger";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Fetch all users (for admin management)
export async function GET(request) {
  return withAuth(async (request, user) => {
    try {
      const db = getFirestore();
      if (!db) {
        return NextResponse.json(
          { error: 'Firebase not initialized' },
          { status: 500 }
        );
      }

      const usersSnapshot = await db.collection('users').get();
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return NextResponse.json({ users });
    } catch (error) {
      logger.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }
  }, 'admin')(request);
}