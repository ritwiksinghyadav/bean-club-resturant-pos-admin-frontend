import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'superadmin' | 'admin' | 'kitchen';
      accessToken?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: 'superadmin' | 'admin' | 'kitchen';
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'superadmin' | 'admin' | 'kitchen';
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
  }
}
