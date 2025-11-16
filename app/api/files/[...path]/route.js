import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const pathSegments = params.path;
    const filePath = pathSegments.join("/");

    // Only allow access to public-files folder
    if (!filePath.startsWith("public-files/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Construct Firebase Storage URL
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const encodedPath = encodeURIComponent(filePath);
    const storageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`;

    // Fetch the file from Firebase Storage
    const response = await fetch(storageUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: "File not found" },
        { status: response.status }
      );
    }

    // Get the file content
    const fileBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "application/octet-stream";

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline", // Display in browser, not download
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("File proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
