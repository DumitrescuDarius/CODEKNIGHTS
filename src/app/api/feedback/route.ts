import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { feedback, userEmail } = await req.json();

    if (!feedback) {
      return NextResponse.json({ error: "Feedback is required" }, { status: 400 });
    }

    // Use environment variables for SMTP configuration
    // Recommend setting EMAIL_USER and EMAIL_PASS in .env
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Check if auth is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("EMAIL_USER or EMAIL_PASS not configured in .env. Cannot send real email.");
      return NextResponse.json({ error: "Email configuration missing on server." }, { status: 500 });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "dumitrescu.darius.ioan@gmail.com",
      subject: `New Feedback from Code Knights ${userEmail ? `(${userEmail})` : ''}`,
      text: feedback,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback error:", error);
    return NextResponse.json({ error: "Failed to send feedback" }, { status: 500 });
  }
}
