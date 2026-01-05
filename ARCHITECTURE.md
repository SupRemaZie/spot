# 🏗️ Architecture - Application de Gestion de Projets

## 📐 Diagramme Logique

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Dashboard  │  │   Projets    │  │   Tâches     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              NEXT.JS APP ROUTER (Server)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              MIDDLEWARE LAYER                         │  │
│  │  • Auth Middleware (NextAuth.js)                     │  │
│  │  • RBAC Middleware (role_principal check)            │  │
│  │  • Audit Log Middleware (auto-logging)               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              APP ROUTES (Server Components)          │  │
│  │  /app/dashboard                                       │  │
│  │  /app/projets                                         │  │
│  │  /app/taches                                          │  │
│  │  /app/membres                                         │  │
│  │  /app/temps                                           │  │
│  │  /app/admin                                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              SERVER ACTIONS                           │  │
│  │  /app/actions/projets.ts                              │  │
│  │  /app/actions/taches.ts                               │  │
│  │  /app/actions/membres.ts                              │  │
│  │  /app/actions/feuilles-temps.ts                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              SERVICES LAYER                           │  │
│  │  /lib/services/projet.service.ts                      │  │
│  │  /lib/services/tache.service.ts                       │  │
│  │  /lib/services/membre.service.ts                       │  │
│  │  /lib/services/audit.service.ts                        │  │
│  │  /lib/services/notification.service.ts                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              MODELS LAYER (Mongoose)                  │  │
│  │  /lib/models/Projet.model.ts                          │  │
│  │  /lib/models/Tache.model.ts                           │  │
│  │  /lib/models/Membre.model.ts                          │  │
│  │  /lib/models/FeuilleTemps.model.ts                    │  │
│  │  /lib/models/Commentaire.model.ts                     │  │
│  │  /lib/models/Notification.model.ts                    │  │
│  │  /lib/models/AuditLog.model.ts                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              DATABASE CONNECTION                       │  │
│  │  /lib/db/mongodb.ts (Singleton Pattern)               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ MongoDB Driver
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              MONGODB ATLAS (Cloud)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ projets  │  │  taches  │  │ membres  │  │feuilles_ │  │
│  │          │  │          │  │          │  │  temps   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │commentai │  │notificat │  │audit_logs│                │
│  │   res    │  │   ions   │  │          │                │
│  └──────────┘  └──────────┘  └──────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## 🗂️ Structure des Dossiers

```
my-app/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route group pour auth
│   │   ├── login/
│   │   └── callback/
│   ├── (dashboard)/              # Route group protégé
│   │   ├── dashboard/
│   │   ├── projets/
│   │   │   ├── [id]/
│   │   │   └── page.tsx
│   │   ├── taches/
│   │   │   ├── [id]/
│   │   │   └── page.tsx
│   │   ├── membres/
│   │   ├── temps/
│   │   └── admin/
│   ├── api/                      # API Routes (si nécessaire)
│   │   ├── auth/
│   │   └── webhooks/
│   ├── actions/                  # Server Actions
│   │   ├── projets.ts
│   │   ├── taches.ts
│   │   ├── membres.ts
│   │   ├── feuilles-temps.ts
│   │   ├── commentaires.ts
│   │   └── notifications.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── lib/
│   ├── db/
│   │   └── mongodb.ts            # Connexion MongoDB (singleton)
│   │
│   ├── models/                    # Schémas Mongoose
│   │   ├── Projet.model.ts
│   │   ├── Tache.model.ts
│   │   ├── Membre.model.ts
│   │   ├── FeuilleTemps.model.ts
│   │   ├── Commentaire.model.ts
│   │   ├── Notification.model.ts
│   │   └── AuditLog.model.ts
│   │
│   ├── services/                 # Logique métier
│   │   ├── projet.service.ts
│   │   ├── tache.service.ts
│   │   ├── membre.service.ts
│   │   ├── feuille-temps.service.ts
│   │   ├── audit.service.ts
│   │   └── notification.service.ts
│   │
│   ├── auth/                     # Configuration NextAuth
│   │   ├── config.ts
│   │   └── middleware.ts
│   │
│   ├── rbac/                     # RBAC & Permissions
│   │   ├── permissions.ts        # Définition des permissions
│   │   ├── roles.ts              # Mapping roles → permissions
│   │   └── middleware.ts         # Middleware RBAC
│   │
│   ├── utils/                    # Utilitaires
│   │   ├── validation.ts
│   │   ├── errors.ts
│   │   └── helpers.ts
│   │
│   └── types/                    # Types TypeScript
│       ├── mongodb.d.ts          # Types MongoDB
│       ├── projet.types.ts
│       ├── tache.types.ts
│       ├── membre.types.ts
│       └── common.types.ts
│
├── components/                   # Composants React réutilisables
│   ├── ui/                       # Composants UI de base
│   ├── projets/
│   ├── taches/
│   ├── membres/
│   └── shared/
│
├── hooks/                        # React Hooks personnalisés
│
├── public/                       # Assets statiques
│
├── .env.local                    # Variables d'environnement (local)
├── .env.example                  # Template des variables
│
└── ARCHITECTURE.md               # Ce fichier
```

## 🔐 Mapping Rôle → Permissions (RBAC)

### Rôles Principaux (basés sur `membres.role_principal`)

| Rôle Principal | Permissions | Description |
|----------------|-------------|-------------|
| **ADMIN** | `*` (toutes) | Accès complet, gestion utilisateurs, configuration |
| **DIRECTEUR** | `projets:read`, `projets:create`, `projets:update`, `projets:delete`, `taches:read`, `membres:read`, `rapports:read`, `admin:read` | Vue globale, gestion stratégique |
| **CHEF_PROJET** | `projets:read`, `projets:update` (ses projets), `taches:read`, `taches:create`, `taches:update`, `taches:delete`, `membres:read`, `feuilles_temps:read`, `feuilles_temps:validate`, `rapports:read` | Gestion de ses projets |
| **MEMBRE** | `projets:read` (assignés), `taches:read` (assignées), `taches:update` (assignées), `feuilles_temps:create`, `feuilles_temps:read` (siennes), `commentaires:create`, `commentaires:read` | Utilisateur standard |
| **OBSERVATEUR** | `projets:read`, `taches:read`, `rapports:read` | Lecture seule |

### Rôles Secondaires (basés sur `membres.roles_secondaires`)

Les rôles secondaires ajoutent des permissions supplémentaires :
- `TECHNICAL_LEAD` → `taches:assign`, `taches:review`
- `RESPONSABLE_RH` → `membres:read`, `membres:update` (compétences, disponibilités)
- `COMPTABLE` → `feuilles_temps:read`, `feuilles_temps:validate`, `rapports:financial`

### Système de Permissions

```typescript
// Structure de permission
Permission = {
  resource: 'projets' | 'taches' | 'membres' | 'feuilles_temps' | 'commentaires' | 'notifications' | 'rapports' | 'admin',
  action: 'create' | 'read' | 'update' | 'delete' | 'validate' | 'assign' | 'review'
}

// Vérification : role_principal + roles_secondaires → permissions cumulées
```

## 🔒 Stratégie d'Audit (`audit_logs`)

### Événements audités automatiquement

1. **Création** : `action: 'CREATE'`, `collection`, `document_id`, `user_id`, `timestamp`
2. **Modification** : `action: 'UPDATE'`, `changes` (diff), `previous_value`, `new_value`
3. **Suppression** : `action: 'DELETE'`, `document_snapshot` (avant suppression)
4. **Consultation** : `action: 'READ'` (pour données sensibles uniquement)
5. **Authentification** : `action: 'LOGIN'`, `action: 'LOGOUT'`, `action: 'LOGIN_FAILED'`
6. **Autorisation** : `action: 'PERMISSION_DENIED'`, `resource`, `attempted_action`

### Implémentation

- **Middleware global** : intercepte toutes les opérations MongoDB
- **Hooks Mongoose** : `pre('save')`, `pre('remove')` pour auto-logging
- **Service dédié** : `/lib/services/audit.service.ts` pour centraliser

## 🌍 Gestion des Environnements

### Variables d'environnement requises

```bash
# .env.local (développement)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/project_management_dev?retryWrites=true&w=majority
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development

# .env.production (production)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/project_management_prod?retryWrites=true&w=majority
NEXTAUTH_SECRET=production-secret-key
NEXTAUTH_URL=https://your-domain.com
NODE_ENV=production
```

### Connexion MongoDB (Singleton Pattern)

```typescript
// /lib/db/mongodb.ts
// Pattern singleton pour éviter les connexions multiples
// Gestion automatique de la reconnexion
// Pool de connexions optimisé
```

## 📦 Dépendances à Ajouter

```json
{
  "dependencies": {
    "mongoose": "^8.0.0",
    "next-auth": "^5.0.0",
    "zod": "^3.22.0",           // Validation
    "date-fns": "^3.0.0",       // Dates
    "@tanstack/react-query": "^5.0.0"  // Client state management (optionnel)
  }
}
```

## ✅ Points de Validation

- [x] Architecture Next.js App Router définie
- [x] Structure des dossiers organisée
- [x] RBAC basé sur `membres.role_principal` + `roles_secondaires`
- [x] Stratégie d'audit automatique définie
- [x] Gestion des environnements préparée
- [x] Choix techniques justifiés (Mongoose, NextAuth.js v5)

---

**⚠️ ATTENTION** : Le modèle MongoDB détaillé (schémas JSON, enums, relations) n'a pas encore été fourni. 
L'architecture est prête à l'accueillir dans l'ÉTAPE 2.

