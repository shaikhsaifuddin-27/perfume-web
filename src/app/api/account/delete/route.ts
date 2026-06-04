import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { auditLog } from '@/lib/audit';

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check for historical orders
    const orderCount = await prisma.order.count({
      where: { userId },
    });

    if (orderCount > 0) {
      // Anonymize user details to satisfy erasure while preserving business records
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: {
            email: `deleted-user-${userId}@maisonelara.com`,
            name: 'Deleted User',
            phone: null,
            password: null,
            mfaSecret: null,
            mfaEnabled: false,
          },
        }),
        prisma.address.deleteMany({
          where: { userId },
        }),
        prisma.review.deleteMany({
          where: { userId },
        }),
        prisma.wishlistItem.deleteMany({
          where: { userId },
        }),
        prisma.order.updateMany({
          where: { userId },
          data: {
            email: `deleted-user-${userId}@maisonelara.com`,
            shippingName: '[REDACTED]',
            shippingAddress: '[REDACTED]',
            shippingCity: '[REDACTED]',
            shippingCountry: '[REDACTED]',
            shippingZip: '[REDACTED]',
            shippingPhone: '[REDACTED]',
          },
        }),
      ]);

      logger.info('User account anonymized (historical orders present)', { userId });
    } else {
      // Delete user fully
      await prisma.user.delete({
        where: { id: userId },
      });
      logger.info('User account fully deleted (no historical orders)', { userId });
    }

    await auditLog({
      action: 'PROFILE_UPDATE',
      actorUserId: userId,
      targetType: 'User',
      targetId: userId,
      metadata: { action: 'ACCOUNT_DELETION' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Account deletion error', error);
    return NextResponse.json({ error: 'Failed to process account deletion.' }, { status: 500 });
  }
}
