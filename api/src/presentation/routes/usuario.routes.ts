import { Router } from 'express'
import { UsuarioController } from '../controllers/UsuarioController'
import { authMiddleware, authOpcional } from '../../infrastructure/auth/SupabaseAuthMiddleware'
import { validate } from '../middlewares/validate.middleware'
import { registrarUsuarioSchema, actualizarPerfilSchema } from '../validations/schemas'

const router = Router()
const ctrl   = new UsuarioController()

router.post('/',                          ctrl.registrar)
router.get('/me',          authMiddleware, ctrl.me)
router.get('/sugeridos',   authOpcional,   ctrl.sugeridos)
router.get('/buscar',      authOpcional,   ctrl.buscar)
router.get('/:username',   authOpcional,   ctrl.perfil)
router.get('/:username/actividad', authOpcional, ctrl.actividad)
router.put('/me',          authMiddleware, validate(actualizarPerfilSchema), ctrl.actualizar)
router.post('/:id/seguir', authMiddleware, ctrl.toggleSeguir)
router.get('/:id/seguidores',             ctrl.seguidores)
router.get('/:id/siguiendo',              ctrl.siguiendo)

export default router
