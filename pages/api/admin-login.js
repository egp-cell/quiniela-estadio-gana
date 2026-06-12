export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ exito: false, error: 'Metodo no permitido' });
  }
  const real = process.env.ADMIN_PASSWORD;
  if (!real) {
    return res.status(500).json({ exito: false, error: 'Falta ADMIN_PASSWORD en variables de entorno' });
  }
  const { password } = req.body || {};
  if (!password || password !== real) {
    return res.status(401).json({ exito: false, error: 'Contraseña incorrecta' });
  }
  return res.status(200).json({ exito: true });
}
