'use client';
import React from 'react';
import { ActiveThemeProvider } from '../active-theme';
import { SessionProvider } from 'next-auth/react';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SessionProvider>
        <ActiveThemeProvider initialTheme={activeThemeValue}>
          {children}
        </ActiveThemeProvider>
      </SessionProvider>
    </>
  );
}
