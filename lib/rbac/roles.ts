/**
 * Mapping des rôles vers les permissions
 * Basé sur membres.role_principal et membres.roles_secondaires
 */

import { Permission, PERMISSIONS } from './permissions';

export type RolePrincipal = 
  | 'ADMIN'
  | 'DIRECTEUR'
  | 'CHEF_PROJET'
  | 'MEMBRE'
  | 'OBSERVATEUR';

export type RoleSecondaire = 
  | 'TECHNICAL_LEAD'
  | 'RESPONSABLE_RH'
  | 'COMPTABLE';

/**
 * Permissions par rôle principal
 */
const ROLE_PERMISSIONS: Record<RolePrincipal, Permission[]> = {
  ADMIN: [
    // Toutes les permissions
    ...Object.values(PERMISSIONS),
  ],
  
  DIRECTEUR: [
    // Projets
    PERMISSIONS.PROJETS_CREATE,
    PERMISSIONS.PROJETS_READ,
    PERMISSIONS.PROJETS_UPDATE,
    PERMISSIONS.PROJETS_DELETE,
    
    // Tâches (lecture)
    PERMISSIONS.TACHES_READ,
    
    // Membres (lecture)
    PERMISSIONS.MEMBRES_READ,
    
    // Feuilles de temps (lecture)
    PERMISSIONS.FEUILLES_TEMPS_READ,
    
    // Rapports
    PERMISSIONS.RAPPORTS_READ,
    PERMISSIONS.RAPPORTS_FINANCIAL,
    
    // Admin (lecture)
    PERMISSIONS.ADMIN_READ,
  ],
  
  CHEF_PROJET: [
    // Projets (ses projets uniquement)
    PERMISSIONS.PROJETS_READ,
    PERMISSIONS.PROJETS_UPDATE,
    
    // Tâches (gestion complète)
    PERMISSIONS.TACHES_CREATE,
    PERMISSIONS.TACHES_READ,
    PERMISSIONS.TACHES_UPDATE,
    PERMISSIONS.TACHES_DELETE,
    PERMISSIONS.TACHES_ASSIGN,
    
    // Membres (lecture)
    PERMISSIONS.MEMBRES_READ,
    
    // Feuilles de temps
    PERMISSIONS.FEUILLES_TEMPS_READ,
    PERMISSIONS.FEUILLES_TEMPS_VALIDATE,
    
    // Rapports
    PERMISSIONS.RAPPORTS_READ,
  ],
  
  MEMBRE: [
    // Projets (assignés uniquement)
    PERMISSIONS.PROJETS_READ,
    
    // Tâches (assignées uniquement)
    PERMISSIONS.TACHES_READ,
    PERMISSIONS.TACHES_UPDATE,
    
    // Feuilles de temps (siennes)
    PERMISSIONS.FEUILLES_TEMPS_CREATE,
    PERMISSIONS.FEUILLES_TEMPS_READ,
    PERMISSIONS.FEUILLES_TEMPS_UPDATE,
    
    // Commentaires
    PERMISSIONS.COMMENTAIRES_CREATE,
    PERMISSIONS.COMMENTAIRES_READ,
    
    // Notifications
    PERMISSIONS.NOTIFICATIONS_READ,
    PERMISSIONS.NOTIFICATIONS_UPDATE,
  ],
  
  OBSERVATEUR: [
    // Lecture seule
    PERMISSIONS.PROJETS_READ,
    PERMISSIONS.TACHES_READ,
    PERMISSIONS.RAPPORTS_READ,
  ],
};

/**
 * Permissions supplémentaires par rôle secondaire
 */
const SECONDARY_ROLE_PERMISSIONS: Record<RoleSecondaire, Permission[]> = {
  TECHNICAL_LEAD: [
    PERMISSIONS.TACHES_ASSIGN,
    PERMISSIONS.TACHES_REVIEW,
  ],
  
  RESPONSABLE_RH: [
    PERMISSIONS.MEMBRES_READ,
    PERMISSIONS.MEMBRES_UPDATE,
  ],
  
  COMPTABLE: [
    PERMISSIONS.FEUILLES_TEMPS_READ,
    PERMISSIONS.FEUILLES_TEMPS_VALIDATE,
    PERMISSIONS.RAPPORTS_FINANCIAL,
  ],
};

/**
 * Récupère toutes les permissions d'un utilisateur
 * basé sur son role_principal + roles_secondaires
 */
export function getUserPermissions(
  rolePrincipal: RolePrincipal,
  rolesSecondaires: RoleSecondaire[] = []
): Permission[] {
  const permissions = new Set<Permission>(ROLE_PERMISSIONS[rolePrincipal]);
  
  // Ajouter les permissions des rôles secondaires
  rolesSecondaires.forEach((role) => {
    SECONDARY_ROLE_PERMISSIONS[role]?.forEach((perm) => {
      permissions.add(perm);
    });
  });
  
  return Array.from(permissions);
}

/**
 * Vérifie si un utilisateur a une permission spécifique
 */
export function hasPermission(
  userPermissions: Permission[],
  requiredPermission: Permission
): boolean {
  return userPermissions.includes(requiredPermission);
}

/**
 * Vérifie si un utilisateur a au moins une des permissions requises
 */
export function hasAnyPermission(
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.some((perm) => userPermissions.includes(perm));
}

/**
 * Vérifie si un utilisateur a toutes les permissions requises
 */
export function hasAllPermissions(
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.every((perm) => userPermissions.includes(perm));
}

