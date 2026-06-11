import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // AUTH_API_URL is a server-only env var (no NEXT_PUBLIC_ prefix) so it
          // works inside the Edge runtime where localhost fetch can fail.
          const apiUrl =
            process.env.AUTH_API_URL || process.env.NEXT_PUBLIC_API_URL;
          console.log(
            `[Admin Login API Request]: URL=${apiUrl}/admin/auth/login, Body=`,
            { email: credentials.email }
          );
          const res = await fetch(`${apiUrl}/admin/auth/login`, {
            method: 'POST',
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password
            }),
            headers: { 'Content-Type': 'application/json' }
          });

          const responseData = await res.json();
          console.log(
            `[Admin Login API Response]: Status=${res.status}, Body=`,
            responseData
          );

          if (res.ok && responseData.success && responseData.result) {
            const { admin, accessToken, refreshToken, token } =
              responseData.result;
            // Return user details + backend tokens to be serialized
            return {
              id: admin.id,
              name: admin.name,
              email: admin.email,
              role: admin.role,
              accessToken: accessToken || token,
              refreshToken: refreshToken || null
            };
          }

          return null;
        } catch (error) {
          console.error('NextAuth authorize error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        // Access tokens expire in 15 minutes, refresh 1 minute early (14 mins)
        token.accessTokenExpires = Date.now() + 14 * 60 * 1000;
        return token;
      }

      // If token is not expired, return it
      if (
        token.accessTokenExpires &&
        Date.now() < (token.accessTokenExpires as number)
      ) {
        return token;
      }

      // Access token has expired, try to update it using refreshToken
      if (!token.refreshToken) {
        return { ...token, error: 'RefreshAccessTokenError' };
      }

      try {
        const apiUrl =
          process.env.AUTH_API_URL || process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/admin/auth/refresh`, {
          method: 'POST',
          body: JSON.stringify({
            refreshToken: token.refreshToken
          }),
          headers: { 'Content-Type': 'application/json' }
        });

        const responseData = await res.json();

        if (res.ok && responseData.success && responseData.result) {
          const { accessToken, refreshToken } = responseData.result;
          return {
            ...token,
            accessToken,
            refreshToken: refreshToken || token.refreshToken,
            accessTokenExpires: Date.now() + 14 * 60 * 1000
          };
        }

        return { ...token, error: 'RefreshAccessTokenError' };
      } catch (error) {
        console.error('NextAuth refresh token error:', error);
        return { ...token, error: 'RefreshAccessTokenError' };
      }
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).accessToken = token.accessToken as string;
        (session.user as any).error = token.error;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/sign-in'
  },
  session: {
    strategy: 'jwt'
  }
});
