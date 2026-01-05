/**
 * Types TypeScript pour NextAuth.js
 * Extension des types par défaut pour inclure les données membres
 */

import { DefaultSession } from 'next-auth';
import { RolePrincipal, RoleSecondaire } from '../types/membre.types';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role_principal: RolePrincipal;
      roles_secondaires: RoleSecondaire[];
      statut: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role_principal: RolePrincipal;
    roles_secondaires: RoleSecondaire[];
    statut: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role_principal: RolePrincipal;
    roles_secondaires: RoleSecondaire[];
    statut: string;
  }
}

