# VM Parking

Sistema de gestão para estacionamento, com controle de entradas e saídas, caixa, mensalistas, auditoria e comprovantes digitais.

## Estrutura

- `src/`: interface React/Vite e componentes do painel.
- `src/lib/`: cliente da API, máscaras e catálogos do formulário.
- `server/`: autenticação, persistência Neon e regras de negócio.
- `api/`: entrada serverless da Vercel.
- `database/`: esquema do banco Neon.
- `public/`: arquivos públicos da marca.

## Desenvolvimento

1. Copie `.env.example` para `.env.local`.
2. Preencha `DATABASE_URL`, defina um `SESSION_SECRET` forte e exclusivo e, em um banco novo, configure `INITIAL_ADMIN_*`.
3. Instale as dependências com `npm.cmd install`.
4. Execute `npm.cmd run dev`.

## Segurança

- A API exige sessão assinada para todos os dados operacionais.
- Senhas novas são protegidas com `scrypt`; senhas antigas são atualizadas após o próximo login.
- O cadastro de usuários exige senha inicial com ao menos 8 caracteres.
- Redefinição sem sessão foi desativada: o administrador redefine senhas no cadastro de usuários.
- Antes do deploy, configure `DATABASE_URL`, `SESSION_SECRET` e `APP_URL` nas variáveis de ambiente da Vercel.

## Validação

```powershell
npm.cmd run build
node --check server.ts
```
