'use client';

import {
  ThemeProvider as NextThemesProvider,
  ThemeProviderProps
} from 'next-themes';
import { usePathname } from 'next/navigation';

export default function ThemeProvider({
  children,
  ...props
}: ThemeProviderProps) {
  const pathname = usePathname();
  const isUserSide = pathname?.startsWith('/users') || pathname === '/';

  return (
    <NextThemesProvider 
      {...props} 
      forcedTheme={isUserSide ? 'light' : props.forcedTheme}
    >
      {children}
    </NextThemesProvider>
  );
}
