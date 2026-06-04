import { NextResponse } from 'next/server';

export async function GET() {
  const securityTxt = [
    'Contact: mailto:security@maisonelara.com',
    'Expires: 2027-12-31T23:59:59.000Z',
    'Encryption: https://maisonelara.com/privacy',
    'Preferred-Languages: en',
    'Policy: https://maisonelara.com/privacy',
  ].join('\n');

  return new NextResponse(securityTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
