/**
 * Définition des permissions de l'application
 * Basé sur le système RBAC avec role_principal + roles_secondaires
 */

export type Resource = 
  | 'projets'
  | 'taches'
  | 'membres'
  | 'feuilles_temps'
  | 'commentaires'
  | 'notifications'
  | 'rapports'
  | 'admin';

export type Action = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'validate'
  | 'assign'
  | 'review';

export type Permission = `${Resource}:${Action}`;

/**
 * Toutes les permissions disponibles dans l'application
 */
export const PERMISSIONS = {
  // Projets
  PROJETS_CREATE: 'projets:create' as Permission,
  PROJETS_READ: 'projets:read' as Permission,
  PROJETS_UPDATE: 'projets:update' as Permission,
  PROJETS_DELETE: 'projets:delete' as Permission,
  
  // Tâches
  TACHES_CREATE: 'taches:create' as Permission,
  TACHES_READ: 'taches:read' as Permission,
  TACHES_UPDATE: 'taches:update' as Permission,
  TACHES_DELETE: 'taches:delete' as Permission,
  TACHES_ASSIGN: 'taches:assign' as Permission,
  TACHES_REVIEW: 'taches:review' as Permission,
  
  // Membres
  MEMBRES_CREATE: 'membres:create' as Permission,
  MEMBRES_READ: 'membres:read' as Permission,
  MEMBRES_UPDATE: 'membres:update' as Permission,
  MEMBRES_DELETE: 'membres:delete' as Permission,
  
  // Feuilles de temps
  FEUILLES_TEMPS_CREATE: 'feuilles_temps:create' as Permission,
  FEUILLES_TEMPS_READ: 'feuilles_temps:read' as Permission,
  FEUILLES_TEMPS_UPDATE: 'feuilles_temps:update' as Permission,
  FEUILLES_TEMPS_DELETE: 'feuilles_temps:delete' as Permission,
  FEUILLES_TEMPS_VALIDATE: 'feuilles_temps:validate' as Permission,
  
  // Commentaires
  COMMENTAIRES_CREATE: 'commentaires:create' as Permission,
  COMMENTAIRES_READ: 'commentaires:read' as Permission,
  COMMENTAIRES_UPDATE: 'commentaires:update' as Permission,
  COMMENTAIRES_DELETE: 'commentaires:delete' as Permission,
  
  // Notifications
  NOTIFICATIONS_READ: 'notifications:read' as Permission,
  NOTIFICATIONS_UPDATE: 'notifications:update' as Permission,
  
  // Rapports
  RAPPORTS_READ: 'rapports:read' as Permission,
  RAPPORTS_FINANCIAL: 'rapports:financial' as Permission,
  
  // Administration
  ADMIN_READ: 'admin:read' as Permission,
  ADMIN_WRITE: 'admin:write' as Permission,
} as const;

