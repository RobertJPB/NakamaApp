import { Router } from 'express'
import { BibliotecaController } from '../controllers/BibliotecaController'
import { authMiddleware } from '../../infrastructure/auth/SupabaseAuthMiddleware'

const router = Router()
const ctrl   = new BibliotecaController()

router.get('/:usuarioId',                       ctrl.getLista)
router.get('/:usuarioId/stats',                 ctrl.getStats)
router.get('/:usuarioId/ruleta',                ctrl.getRuleta)
router.post('/',              authMiddleware,    ctrl.agregar)
router.put('/:animeId',       authMiddleware,    ctrl.actualizar)
router.delete('/:animeId',    authMiddleware,    ctrl.eliminar)

export default router
