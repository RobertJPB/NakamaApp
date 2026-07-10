import { Router } from 'express'
import { UsuarioController } from '../controllers/UsuarioController'
import { authMiddleware } from '../../infrastructure/auth/SupabaseAuthMiddleware'

const router = Router()
const ctrl   = new UsuarioController()

router.post('/',                          ctrl.registrar)
router.get('/:username',                  ctrl.perfil)
router.put('/me',          authMiddleware, ctrl.actualizar)
router.post('/:id/seguir', authMiddleware, ctrl.toggleSeguir)
router.get('/:id/seguidores',             ctrl.seguidores)
router.get('/:id/siguiendo',              ctrl.siguiendo)

export default router
