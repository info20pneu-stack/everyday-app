import type { Metadata } from 'next';
import AdminClient from './AdminClient';

export const metadata: Metadata = {
  title: 'Admin | EVERY DAY',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminClient />;
}
