// pages/api/generateQRCode.js
import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getFirestore } from "../../../utils/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";

export async function POST(request) {
  try {
    const { eventId, adminEmail } = await request.json();

    // Get Firebase Admin Firestore instance
    const db = getFirestore();
    if (!db) {
      return NextResponse.json(
        { message: "Firebase Admin not available" },
        { status: 500 }
      );
    }

    // Admin check
    if (!adminEmail) {
      return NextResponse.json(
        { message: "Admin email required for authorization" },
        { status: 401 }
      );
    }

    const adminRef = db.collection("admins").doc(adminEmail);
    const adminSnap = await adminRef.get();

    if (!adminSnap.exists) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid admin email" },
        { status: 403 }
      );
    }

    // Check for existing QR code
    const qrCodesRef = db.collection("eventQrCodes");
    const qrCodeQuery = qrCodesRef.where("eventId", "==", eventId);
    const qrCodeSnapshot = await qrCodeQuery.get();

    if (!qrCodeSnapshot.empty) {
      return NextResponse.json(
        { message: "QR code already exists for this event." },
        { status: 409 } // 409 Conflict
      );
    }

    // Generate unique QR code ID
    const qrCodeId = uuidv4();
    
    // Always use production URL for QR codes
    const qrCodeData = `https://gdgoncampustu.com/events?qrCode=${qrCodeId}`;

    // Generate the QR Code as a Data URL
    const qrCodeDataURL = await QRCode.toDataURL(qrCodeData, {
      errorCorrectionLevel: "H",
    });

    // Store QR code in Firestore using Admin SDK
    const qrCodeRef = db.collection("eventQrCodes").doc(qrCodeId);
    await qrCodeRef.set({
      eventId: eventId,
      code: qrCodeData,
      createdAt: new Date(),
      createdBy: adminEmail,
    });

    return NextResponse.json({ qrCodeDataURL, qrCodeId });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to generate QR code.", error: error.message },
      { status: 500 }
    );
  }
}
