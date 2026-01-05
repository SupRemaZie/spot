# Script PowerShell pour lancer Next.js sans Turbopack
$env:NEXT_PRIVATE_DISABLE_TURBO = "1"
npm run dev

