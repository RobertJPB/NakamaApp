import { Router } from 'express'
import { AnimeController } from '../controllers/AnimeController'
import { limiterProxyImagen } from '../middlewares/rateLimit'

const router = Router()
const ctrl = new AnimeController()

router.get('/', ctrl.buscar)
router.get('/populares', ctrl.populares)
router.get('/personajes', ctrl.personajes)
router.get('/proxy-image', limiterProxyImagen, ctrl.proxyImage)
router.get('/:externalId', ctrl.detalle)

export default router
