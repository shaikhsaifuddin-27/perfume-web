import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { auditLog } from '@/lib/audit';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        addresses: true,
        orders: {
          include: {
            items: true,
          },
        },
        reviews: true,
        wishlist: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
        consentRecords: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Sanitize sensitive authentication parameters before export
    const sanitizedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      mfaEnabled: user.mfaEnabled,
      createdAt: user.createdAt,
      addresses: user.addresses.map((a) => ({
        firstName: a.firstName,
        lastName: a.lastName,
        address: a.address,
        city: a.city,
        country: a.country,
        zip: a.zip,
        phone: a.phone,
      })),
      reviews: user.reviews.map((r) => ({
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
      })),
      wishlist: user.wishlist.map((w) => ({
        productName: w.product.name,
        createdAt: w.createdAt,
      })),
      orders: user.orders.map((o) => ({
        id: o.id,
        status: o.status,
        total: o.total,
        tax: o.tax,
        shipping: o.shipping,
        shippingName: o.shippingName,
        shippingAddress: o.shippingAddress,
        shippingCity: o.shippingCity,
        shippingCountry: o.shippingCountry,
        shippingZip: o.shippingZip,
        createdAt: o.createdAt,
        items: o.items.map((i) => ({
          productName: i.productName,
          quantity: i.quantity,
          priceAtTime: i.priceAtTime,
          sizeMl: i.sizeMl,
        })),
      })),
      consentRecords: user.consentRecords.map((c) => ({
        consentType: c.consentType,
        status: c.status,
        createdAt: c.createdAt,
      })),
    };

    await auditLog({
      action: 'PROFILE_UPDATE',
      actorUserId: session.user.id,
      targetType: 'User',
      targetId: session.user.id,
      metadata: { action: 'DATA_EXPORT' },
    });

    return NextResponse.json(sanitizedUser);
  } catch (error) {
    logger.error('Data export error', error);
    return NextResponse.json({ error: 'Failed to export data.' }, { status: 500 });
  }
}
