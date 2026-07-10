import { Router } from 'express'
import { NotificacionController } from '../controllers/NotificacionController'
import { authMiddleware } from '../../infrastructure/auth/SupabaseAuthMiddleware'

const router = Router()
const ctrl   = new NotificacionController()

router.get('/',          authMiddleware, ctrl.listar)
router.put('/leer-todo', authMiddleware, ctrl.marcarTodasLeidas)
router.put('/:id/leer',  authMiddleware, ctrl.marcarLeida)

export default router
