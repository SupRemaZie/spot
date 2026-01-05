/**
 * Configuration NextAuth.js v5 (Auth.js)
 * Point d'entrée principal pour l'authentification
 */

import NextAuth from 'next-auth';
import { authConfig } from './lib/auth/config';

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

