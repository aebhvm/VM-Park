import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

const port = Number(process.env.PORT || 3000);
dotenv.config({ path: '.env.local', quiet: true });

const { default: app } = await import('./server');

const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: 'spa',
});

app.use(vite.middlewares);

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();

  vite.transformIndexHtml(req.url, `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>ParkGestor - Sistema de Gestão para Estacionamento</title>
      </head>
      <body>
        <div id="root"></div>
        <script type="module" src="/src/main.tsx"></script>
      </body>
    </html>
  `).then((html) => {
    res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
  }).catch(next);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Development server running on http://localhost:${port}`);
});
