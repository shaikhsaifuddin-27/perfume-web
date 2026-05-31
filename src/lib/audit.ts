import { AuditAction, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type AuditInput = {
  action: AuditAction;
  actorUserId?: string | null;
  targetType?: string;
  targetId?: string;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
};

export async function auditLog(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        actorUserId: input.actorUserId ?? null,
        targetType: input.targetType,
        targetId: input.targetId,
        ip: input.ip ?? undefined,
        userAgent: input.userAgent ?? undefined,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    console.error('auditLog failed:', error);
  }
}
