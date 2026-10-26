import type { Metadata } from 'next';
import PageShell from '../../components/PageShell';
import SudokuCube from '../../components/games/SudokuCube';

export const metadata: Metadata = {
  title: 'Sudoku Cube | EVERY DAY',
  description: 'Sudoku wrapped around a 3D cube. Spin it, fill every face and beat the daily leaderboard in three difficulties.',
  alternates: { canonical: '/games/sudoku-cube' },
  openGraph: {
    title: 'Sudoku Cube | EVERY DAY',
    description: 'Sudoku wrapped around a 3D cube — the same cube for everyone today.',
    url: 'https://www.everyday1234567.com/games/sudoku-cube',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sudoku Cube | EVERY DAY',
    description: 'Sudoku wrapped around a 3D cube — the same cube for everyone today.',
    images: ['/og-image.png'],
  },
};

export default function SudokuCubePage() {
  return (
    <PageShell>
      <SudokuCube />
    </PageShell>
  );
}
