import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { getRequestMeta } from '@/lib/requestMeta';

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  email: z.string().email('Please enter a valid email'),
  subject: z.string().min(2, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
});

export async function POST(req: NextRequest) {
  const meta = getRequestMeta(req);

  try {
    const body = contactSchema.parse(await req.json());

    // Store in DB if ContactMessage model exists, otherwise just send email
    // Log to AuditLog for traceability
    await prisma.auditLog.create({
      data: {
        action: 'PROFILE_UPDATE', // Reusing closest action; replace with CONTACT_SUBMIT if schema extended
        targetType: 'ContactMessage',
        ip: meta.ip ?? undefined,
        userAgent: meta.userAgent ?? undefined,
        metadata: {
          name: body.name,
          email: body.email,
          subject: body.subject,
          messageLength: body.message.length,
        },
      },
    });

    // Send notification email to admin
    const adminEmail = process.env.EMAIL_FROM ?? process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `[Contact] ${body.subject} — from ${body.name}`,
        text: `New contact message from ${body.name} (${body.email}):\n\n${body.message}`,
      });
    }

    // Send acknowledgement to user
    await sendEmail({
      to: body.email,
      subject: 'Thank you for contacting Maison Élara',
      text: `Dear ${body.name},\n\nThank you for reaching out to Maison Élara. We have received your message and will respond within 1–2 business days.\n\nWarm regards,\nThe Maison Élara Team`,
    });

    return NextResponse.json({ message: 'Your message has been received. We will be in touch shortly.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map(i => i.message).join(', ') }, { status: 400 });
    }
    console.error('Contact API error:', error);
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 });
  }
}
