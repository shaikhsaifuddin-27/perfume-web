import { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import AdminLayoutShell from './AdminLayoutShell';
import { prisma } from '@/lib/prisma';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/account');
  }

  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { mfaEnabled: true },
  });

  if (!adminUser?.mfaEnabled) {
    redirect('/account/mfa');
  }

  return (
    <AdminLayoutShell user={{ name: session.user.name ?? null, email: session.user.email ?? '' }}>
      {children}
    </AdminLayoutShell>
  );
}
