import type { Metadata } from 'next';
import ContactClient from './ContactClient';

export const metadata: Metadata = {
  title: 'Contact Us | Maison Élara',
  description: 'Get in touch with the Maison Élara team. We are here to assist you with any inquiries about our fragrances.',
};

export default function ContactPage() {
  return <ContactClient />;
}
