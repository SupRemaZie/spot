# Solution pour l'erreur Turbopack sur Windows

## Problème

Next.js 16 utilise Turbopack par défaut, ce qui cause une erreur de symlink sur Windows :
```
Error [TurbopackInternalError]: create symlink to ../../../node_modules/mongoose
Caused by: Le client ne dispose pas d'un privilège nécessaire. (os error 1314)
```

## Solutions

### Solution 1 : Utiliser le script dev:webpack (Recommandé)

```bash
npm run dev:webpack
```

Ce script utilise un fichier PowerShell qui définit la variable d'environnement `NEXT_PRIVATE_DISABLE_TURBO=1` avant de lancer Next.js.

### Solution 2 : Définir la variable d'environnement manuellement

Dans PowerShell :
```powershell
$env:NEXT_PRIVATE_DISABLE_TURBO = "1"
npm run dev
```

Dans CMD :
```cmd
set NEXT_PRIVATE_DISABLE_TURBO=1
npm run dev
```

### Solution 3 : Créer un fichier .env.local

Ajoutez cette ligne dans `.env.local` :
```
NEXT_PRIVATE_DISABLE_TURBO=1
```

Puis lancez :
```bash
npm run dev
```

### Solution 4 : Nettoyer et réinstaller

Si le problème persiste :
```powershell
# Supprimer le cache
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

# Réinstaller
npm install

# Lancer avec la variable d'environnement
$env:NEXT_PRIVATE_DISABLE_TURBO = "1"
npm run dev
```

## Note

La variable `NEXT_PRIVATE_DISABLE_TURBO` est une variable privée de Next.js qui force l'utilisation de Webpack au lieu de Turbopack. Cela résout le problème de symlink sur Windows sans nécessiter de privilèges administrateur.

