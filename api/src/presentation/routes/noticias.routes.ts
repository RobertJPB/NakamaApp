import { Router } from 'express'
import { NoticiasController } from '../controllers/NoticiasController'
import { container } from '../../infrastructure/container'

const router = Router()
const controller = new NoticiasController(container.noticiaRepo)

router.get('/', (req, res) => controller.getNoticias(req, res))
router.get('/popular', (req, res) => controller.getPopular(req, res))
router.get('/proxy-image', (req, res, next) => controller.proxyImage(req, res, next))

export default router
