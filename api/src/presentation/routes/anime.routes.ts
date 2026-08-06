import { Router } from 'express'
import { AnimeController } from '../controllers/AnimeController'
import { authMiddleware } from '../../infrastructure/auth/SupabaseAuthMiddleware'

const router = Router()
const ctrl   = new AnimeController()

router.get('/',              ctrl.buscar)
router.get('/populares',     ctrl.populares)
router.get('/personajes',    ctrl.personajes)
router.get('/proxy-image',   ctrl.proxyImage)
router.get('/:externalId',    ctrl.detalle)

export default router
