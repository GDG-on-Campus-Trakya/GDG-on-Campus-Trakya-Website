// pages/api/generateQRCode.js
import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { db } from "../../../firebase";
import { doc, getDoc, setDoc, collection, getDocs, query, where } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

export async function POST(request) {
  try {
    const { eventId, adminEmail } = await request.json();

    // Admin check
    if (!adminEmail) {
      return NextResponse.json(
        { message: "Admin email required for authorization" },
        { status: 401 }
      );
    }

    const adminRef = doc(db, "admins", adminEmail);
    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists()) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid admin email" },
        { status: 403 }
      );
    }

    // Check for existing QR code
    const qrCodesRef = collection(db, "eventQrCodes");
    const qrCodeQuery = query(qrCodesRef, where("eventId", "==", eventId));
    const qrCodeSnapshot = await getDocs(qrCodeQuery);

    if (!qrCodeSnapshot.empty) {
      return NextResponse.json(
        { message: "QR code already exists for this event." },
        { status: 409 } // 409 Conflict
      );
    }

    // Generate unique QR code ID
    const qrCodeId = uuidv4();
    const qrCodeData = `${process.env.NEXT_PUBLIC_BASE_URL}/events?qrCode=${qrCodeId}`;

    // Generate the QR Code as a Data URL
    const qrCodeDataURL = await QRCode.toDataURL(qrCodeData, {
      errorCorrectionLevel: "H",
    });

    // Store QR code in Firestore
    const qrCodeRef = doc(collection(db, "eventQrCodes"), qrCodeId);
    await setDoc(qrCodeRef, {
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
