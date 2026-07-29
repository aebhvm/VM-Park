# VM Parking

Sistema de gestÃ£o para estacionamento, com controle de entradas e saÃ­das, caixa, mensalistas, auditoria e comprovantes digitais.

## Estrutura

- `src/`: interface React/Vite e componentes do painel.
- `src/lib/`: cliente da API, mÃ¡scaras e catÃ¡logos do formulÃ¡rio.
- `server/`: autenticaÃ§Ã£o, persistÃªncia Neon e regras de negÃ³cio.
- `api/`: entrada serverless da Vercel.
- `database/`: esquema do banco Neon.
- `public/`: arquivos pÃºblicos da marca.

## Desenvolvimento

1. Copie `.env.example` para `.env.local`.
2. Preencha `DATABASE_URL`, defina um `SESSION_SECRET` forte e exclusivo e, em um banco novo, configure `INITIAL_ADMIN_*`.
3. Instale as dependÃªncias com `npm.cmd install`.
4. Execute `npm.cmd run dev`.

## SeguranÃ§a

- A API exige sessÃ£o assinada para todos os dados operacionais.
- Senhas novas sÃ£o protegidas com `scrypt`; senhas antigas sÃ£o atualizadas apÃ³s o prÃ³ximo login.
- O cadastro de usuÃ¡rios exige senha inicial com ao menos 8 caracteres.
- RedefiniÃ§Ã£o sem sessÃ£o foi desativada: o administrador redefine senhas no cadastro de usuÃ¡rios.
- Antes do deploy, configure `DATABASE_URL`, `SESSION_SECRET` e `APP_URL` nas variÃ¡veis de ambiente da Vercel.

## ValidaÃ§Ã£o

```powershell
npm.cmd run build
node --check server.ts
```
