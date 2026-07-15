export default async function handler(req: any, res: any) {
  try {
    const { default: app } = await import('../server.js');
    return app(req, res);
  } catch (error) {
    console.error('Failed to initialize the ParkGestor API', error);
    return res.status(500).json({ error: 'Falha ao iniciar a API do ParkGestor.' });
  }
}
