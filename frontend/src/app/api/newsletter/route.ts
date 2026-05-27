import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const newsletterSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = newsletterSchema.parse(body);

    // TODO: Integrate with email provider (Resend/Mailchimp/Klaviyo)
    // For now, just validate and acknowledge
    console.log(`Newsletter signup: ${email}`);

    return NextResponse.json({ message: 'Thank you for subscribing!' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Subscription failed. Please try again.' }, { status: 500 });
  }
}
