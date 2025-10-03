import 'server-only';
import { NextResponse } from "next/server";
import { getFirestore } from "../../../../utils/firebaseAdmin";
import { withAuth } from "../../../../middleware/adminAuthApp";
import { logger } from "@/utils/logger";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Fetch all admins
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

      const adminSnapshot = await db.collection('admins').get();
      const admins = adminSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return NextResponse.json({ admins });
    } catch (error) {
      logger.error('Error fetching admins:', error);
      return NextResponse.json(
        { error: 'Failed to fetch admins' },
        { status: 500 }
      );
    }
  }, 'admin')(request);
}

// POST - Add new admin
export async function POST(request) {
  return withAuth(async (request, user) => {
    try {
      const { email, role } = await request.json();

      if (!email || !role) {
        return NextResponse.json(
          { error: 'Email and role are required' },
          { status: 400 }
        );
      }

      const db = getFirestore();
      if (!db) {
        return NextResponse.json(
          { error: 'Firebase not initialized' },
          { status: 500 }
        );
      }

      const adminRef = db.collection('admins').doc(email);
      await adminRef.set({
        email,
        role,
        createdAt: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        message: 'Admin added successfully'
      });
    } catch (error) {
      logger.error('Error adding admin:', error);
      return NextResponse.json(
        { error: 'Failed to add admin' },
        { status: 500 }
      );
    }
  }, 'admin')(request);
}

// DELETE - Remove admin
export async function DELETE(request) {
  return withAuth(async (request, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const adminId = searchParams.get('id');

      if (!adminId) {
        return NextResponse.json(
          { error: 'Admin ID is required' },
          { status: 400 }
        );
      }

      // Prevent self-deletion
      if (adminId === user.email) {
        return NextResponse.json(
          { error: 'Cannot delete your own admin account' },
          { status: 403 }
        );
      }

      const db = getFirestore();
      if (!db) {
        return NextResponse.json(
          { error: 'Firebase not initialized' },
          { status: 500 }
        );
      }

      await db.collection('admins').doc(adminId).delete();

      return NextResponse.json({
        success: true,
        message: 'Admin removed successfully'
      });
    } catch (error) {
      logger.error('Error removing admin:', error);
      return NextResponse.json(
        { error: 'Failed to remove admin' },
        { status: 500 }
      );
    }
  }, 'admin')(request);
}

// PUT - Update admin role
export async function PUT(request) {
  return withAuth(async (request, user) => {
    try {
      const { adminId, role } = await request.json();

      if (!adminId || !role) {
        return NextResponse.json(
          { error: 'Admin ID and role are required' },
          { status: 400 }
        );
      }

      // Prevent self-role modification
      if (adminId === user.email) {
        return NextResponse.json(
          { error: 'Cannot modify your own role' },
          { status: 403 }
        );
      }

      const db = getFirestore();
      if (!db) {
        return NextResponse.json(
          { error: 'Firebase not initialized' },
          { status: 500 }
        );
      }

      const adminRef = db.collection('admins').doc(adminId);
      await adminRef.update({
        role,
        updatedAt: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        message: 'Admin role updated successfully'
      });
    } catch (error) {
      logger.error('Error updating admin role:', error);
      return NextResponse.json(
        { error: 'Failed to update admin role' },
        { status: 500 }
      );
    }
  }, 'admin')(request);
}