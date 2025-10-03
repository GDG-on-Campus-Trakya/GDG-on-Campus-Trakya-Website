// app/api/sendEmail/route.js
import 'server-only';
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { db } from "../../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { logger } from "@/utils/logger";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { to, subject, text, html, adminEmail } = await request.json();

    // Admin check
    if (!adminEmail) {
      return NextResponse.json({ message: "Admin email required for authorization" }, { status: 401 });
    }

    const adminRef = doc(db, "admins", adminEmail);
    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists()) {
      return NextResponse.json({ message: "Unauthorized: Invalid admin email" }, { status: 403 });
    }

    // Enhanced credential validation
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      logger.error("Missing email credentials in environment variables");
      return NextResponse.json(
        { message: "Server configuration error" },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      },
    });

    // Verify transporter setup
    await transporter.verify();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      text,
      html,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: "Emails sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Email sending error:", error);
    return NextResponse.json(
      {
        message: "Failed to send email",
        error: error.message
      },
      { status: 500 }
    );
  }
}