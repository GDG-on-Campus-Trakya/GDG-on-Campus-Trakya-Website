import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (error) {
    console.error("Firebase Admin init error:", error);
  }
}

const db = getFirestore();
const bucket = getStorage().bucket();

export async function DELETE(request) {
  try {
    console.log("Delete account API called");
    
    // Check if Firebase Admin is initialized
    if (!admin.apps.length) {
      console.error("Firebase Admin not initialized");
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const authToken = request.headers.get('Authorization');

    console.log("UserId:", userId);
    console.log("AuthToken exists:", !!authToken);

    if (!userId || !authToken) {
      return NextResponse.json(
        { error: 'Missing userId or authorization token' },
        { status: 400 }
      );
    }

    // Verify the auth token
    const token = authToken.replace('Bearer ', '');
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Ensure user can only delete their own account
    if (decodedToken.uid !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized - can only delete your own account' },
        { status: 403 }
      );
    }

    // Start a batch for Firestore operations
    const batch = db.batch();

    // 1. Delete user document from 'users' collection
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Delete profile image if exists
      if (userData.imagePath) {
        try {
          await bucket.file(userData.imagePath).delete();
        } catch (error) {
          console.warn('Failed to delete profile image:', error);
        }
      }
      
      batch.delete(userRef);
    }

    // 2. Delete all registrations
    const registrationsRef = db.collection('registrations').where('userId', '==', userId);
    const registrationsSnapshot = await registrationsRef.get();
    
    const qrCodeIds = [];
    registrationsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.qrCodeId) {
        qrCodeIds.push(data.qrCodeId);
      }
      batch.delete(doc.ref);
    });

    // 3. Delete associated QR codes
    for (const qrCodeId of qrCodeIds) {
      const qrCodeRef = db.collection('qrCodes').doc(qrCodeId);
      batch.delete(qrCodeRef);
    }

    // 4. Delete all posts by the user
    const postsRef = db.collection('posts').where('authorId', '==', userId);
    const postsSnapshot = await postsRef.get();
    
    const postImagePaths = [];
    postsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.imageUrl && data.imageUrl.includes('firebasestorage.googleapis.com')) {
        try {
          const url = new URL(data.imageUrl);
          const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
          if (pathMatch) {
            postImagePaths.push(decodeURIComponent(pathMatch[1]));
          }
        } catch (error) {
          console.warn('Failed to extract image path from URL:', error);
        }
      }
      batch.delete(doc.ref);
    });

    // Delete post images
    for (const imagePath of postImagePaths) {
      try {
        await bucket.file(imagePath).delete();
      } catch (error) {
        console.warn('Failed to delete post image:', error);
      }
    }

    // 5. Delete all comments by the user
    const commentsRef = db.collection('comments').where('authorId', '==', userId);
    const commentsSnapshot = await commentsRef.get();
    
    commentsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 6. Delete all likes by the user
    const likesRef = db.collection('likes').where('userId', '==', userId);
    const likesSnapshot = await likesRef.get();
    
    likesSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 7. Delete all ticket attachments by the user
    const ticketsRef = db.collection('tickets').where('authorId', '==', userId);
    const ticketsSnapshot = await ticketsRef.get();
    
    const ticketAttachmentPaths = [];
    ticketsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.attachments && Array.isArray(data.attachments)) {
        data.attachments.forEach(attachment => {
          if (attachment.url && attachment.url.includes('firebasestorage.googleapis.com')) {
            try {
              const url = new URL(attachment.url);
              const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
              if (pathMatch) {
                ticketAttachmentPaths.push(decodeURIComponent(pathMatch[1]));
              }
            } catch (error) {
              console.warn('Failed to extract attachment path from URL:', error);
            }
          }
        });
      }
      batch.delete(doc.ref);
    });

    // Delete ticket attachments
    for (const attachmentPath of ticketAttachmentPaths) {
      try {
        await bucket.file(attachmentPath).delete();
      } catch (error) {
        console.warn('Failed to delete ticket attachment:', error);
      }
    }

    // Commit all Firestore operations
    await batch.commit();

    // 8. Finally, delete the user from Firebase Auth
    await admin.auth().deleteUser(userId);

    return NextResponse.json({ 
      success: true, 
      message: 'Account and all associated data deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account', details: error.message },
      { status: 500 }
    );
  }
}