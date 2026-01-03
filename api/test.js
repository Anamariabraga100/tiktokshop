// Endpoint de teste mínimo - Vercel Serverless Function
// Rota: /api/test
// ESM PURO - package.json tem "type": "module"

export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    message: 'test function working',
    method: req.method,
    timestamp: new Date().toISOString()
  });
}
