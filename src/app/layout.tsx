import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: {
    default: 'GoChinaMed - Medical care in China, made easy',
    template: '%s | GoChinaMed',
  },
  description:
    'GoChinaMed - Your trusted partner for medical tourism in China. Access top hospitals and doctors with AI-powered personalized planning.',
  keywords: [
    'GoChinaMed',
    'Medical Tourism',
    'China Medical Care',
    'Healthcare in China',
    'Medical Treatment Abroad',
    'Medical Assistant',
  ],
  authors: [{ name: 'Shandong Heshifang Information Technology Co., Ltd.' }],
  openGraph: {
    title: 'GoChinaMed - Medical care in China, made easy',
    description:
      'Your trusted partner for medical tourism in China. Access top hospitals and doctors with AI-powered personalized planning.',
    url: 'https://gochinamed.com',
    siteName: 'GoChinaMed',
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <LanguageProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
