import { Metadata } from 'next';
import SuggestClient from './SuggestClient';

export const metadata: Metadata = {
  title: 'Suggest & Vote | EVERY DAY',
  description: 'Navrhni novou funkci nebo hlasuj pro existující návrhy. Pomoz nám zlepšit EVERY DAY.',
};

export default function SuggestPage() {
  return <SuggestClient />;
}
