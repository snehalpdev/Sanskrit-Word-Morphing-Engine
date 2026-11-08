import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Sanskrit Word Morphing Engine',
  description: 'A zero-border dial-based Sanskrit word morphing and linguistic exploration engine with live train-of-thought voice narrative.',
  openGraph: {
    title: 'Sanskrit Word Morphing Engine',
    description: 'A zero-border dial-based Sanskrit word morphing and linguistic exploration engine with live train-of-thought voice narrative.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sanskrit Word Morphing Engine',
    description: 'A zero-border dial-based Sanskrit word morphing and linguistic exploration engine with live train-of-thought voice narrative.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
