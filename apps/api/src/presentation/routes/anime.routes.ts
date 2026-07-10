import { Router } from 'express'
import { AnimeController } from '../controllers/AnimeController'
import { authMiddleware } from '../../infrastructure/auth/SupabaseAuthMiddleware'

const router = Router()
const ctrl   = new AnimeController()

router.get('/',              ctrl.buscar)
router.get('/populares',     ctrl.populares)
router.get('/ranking',       ctrl.ranking)
router.get('/:anilistId',    ctrl.detalle)

export default router
