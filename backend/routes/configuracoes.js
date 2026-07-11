const express = require('express');
const router  = express.Router();
const db      = require('../database/db');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { apenasAdmin } = require('../middlewares/auth');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(__dirname, '..', 'uploads', 'logo');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `logo_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const ok = /image\/(jpeg|png|gif|webp|svg\+xml)/.test(file.mimetype);
    cb(ok ? null : new Error('Formato inválido. Use JPG, PNG, GIF ou WebP.'), ok);
  }
});

// GET /api/config
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT chave, valor FROM configuracoes');
    const cfg = {};
    rows.forEach(r => { cfg[r.chave] = r.valor; });
    res.json(cfg);
  } catch (e) { next(e); }
});

// PUT /api/config
router.put('/', apenasAdmin, async (req, res, next) => {
  try {
    const { nome_loja, slogan } = req.body;
    if (nome_loja !== undefined)
      await db.execute(
        'INSERT INTO configuracoes (chave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = ?',
        ['nome_loja', nome_loja, nome_loja]
      );
    if (slogan !== undefined)
      await db.execute(
        'INSERT INTO configuracoes (chave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = ?',
        ['slogan', slogan, slogan]
      );
    res.json({ mensagem: 'Configurações salvas.' });
  } catch (e) { next(e); }
});

// POST /api/config/logo
router.post('/logo', apenasAdmin, upload.single('logo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado.' });
    const logoPath = `/uploads/logo/${req.file.filename}`;
    await db.execute(
      'INSERT INTO configuracoes (chave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = ?',
      ['logo_path', logoPath, logoPath]
    );
    res.json({ logo_path: logoPath, mensagem: 'Logo atualizada.' });
  } catch (e) { next(e); }
});

module.exports = router;
