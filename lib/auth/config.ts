/**
 * Configuration NextAuth.js v5 (Auth.js)
 * Authentification avec MongoDB et liaison vers membres
 */

import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { Membre } from '../models';
import connectDB from '../db/mongodb';
import bcrypt from 'bcryptjs';
import { createAuditLog } from '../services/audit.service';

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectDB();

          // Rechercher le membre par email
          const membre = await Membre.findOne({ 
            email: credentials.email.toLowerCase(),
            statut: 'ACTIF' // Seuls les membres actifs peuvent se connecter
          }).select('+password'); // Inclure le password (normalement exclu par select: false)

          if (!membre) {
            // Log tentative de connexion échouée
            await createAuditLog('LOGIN_FAILED', {
              metadata: { email: credentials.email, reason: 'User not found or inactive' },
            });
            return null;
          }

          // Vérifier le mot de passe
          if (!membre.password) {
            await createAuditLog('LOGIN_FAILED', {
              user_id: membre._id,
              metadata: { email: credentials.email, reason: 'No password set' },
            });
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            membre.password
          );

          if (!isPasswordValid) {
            // Log tentative de connexion échouée
            await createAuditLog('LOGIN_FAILED', {
              user_id: membre._id,
              metadata: { email: credentials.email, reason: 'Invalid password' },
            });
            return null;
          }

          // Log connexion réussie
          await createAuditLog('LOGIN', {
            user_id: membre._id,
            metadata: { email: credentials.email },
          });

          // Retourner les informations utilisateur
          return {
            id: membre._id.toString(),
            email: membre.email,
            name: `${membre.prenom} ${membre.nom}`,
            role_principal: membre.role_principal,
            roles_secondaires: membre.roles_secondaires || [],
            statut: membre.statut,
          };
        } catch (error) {
          console.error('Erreur lors de l\'authentification:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Lors de la première connexion, user contient les données
      if (user) {
        token.id = user.id;
        token.role_principal = user.role_principal;
        token.roles_secondaires = user.roles_secondaires;
        token.statut = user.statut;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role_principal = token.role_principal as string;
        session.user.roles_secondaires = (token.roles_secondaires || []) as string[];
        session.user.statut = token.statut as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  secret: process.env.NEXTAUTH_SECRET,
};

