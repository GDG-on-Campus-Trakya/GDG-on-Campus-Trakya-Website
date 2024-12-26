import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { db } from "../../../firebase";
import { doc, getDoc } from "firebase/firestore";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const qrCodeId = searchParams.get("qrCodeId");

  if (!qrCodeId) {
    return NextResponse.json(
      { message: "QR Code ID is required" },
      { status: 400 }
    );
  }

  try {
    const qrCodeRef = doc(db, "qrCodes", qrCodeId);
    const qrCodeSnap = await getDoc(qrCodeRef);

    if (!qrCodeSnap.exists()) {
      return NextResponse.json(
        { message: "QR Code not found" },
        { status: 404 }
      );
    }

    const qrCodeData = qrCodeSnap.data().code;
    const qrCodeDataURL = await QRCode.toDataURL(qrCodeData, {
      errorCorrectionLevel: "H",
    });

    return NextResponse.json({ qrCodeDataURL });
  } catch (error) {
    console.error("Error fetching QR code:", error);
    return NextResponse.json(
      { message: "Failed to fetch QR code", error: error.message },
      { status: 500 }
    );
  }
}
