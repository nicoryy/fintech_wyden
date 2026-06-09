# CLAUDE.md — packages/shared

Tipos TypeScript compartilhados entre mobile e api.

## Regras
- Apenas tipos, interfaces e enums — sem lógica de negócio
- Importar no mobile: `import { ... } from '@wyden/shared'`
- Importar na api: `import { ... } from '@wyden/shared'`
- Manter sincronizado com as entities do backend e as interfaces do frontend
