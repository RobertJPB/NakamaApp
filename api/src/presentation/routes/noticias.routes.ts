import { Router } from 'express';
import { NoticiasController } from '../controllers/NoticiasController';

const router = Router();
const controller = new NoticiasController();

router.get('/', (req, res) => controller.getNoticias(req, res));
router.get('/popular', (req, res) => controller.getPopular(req, res));
router.get('/proxy-image', (req, res) => controller.proxyImage(req, res));

export default router;
