import { Router } from 'express'
import { ComunidadController } from '../controllers/ComunidadController'
import { authMiddleware } from '../../infrastructure/auth/SupabaseAuthMiddleware'

const router = Router()
const ctrl   = new ComunidadController()

router.get('/',                             ctrl.listar)
router.get('/:id',                          ctrl.detalle)
router.get('/:id/publicaciones',            ctrl.publicaciones)
router.post('/',              authMiddleware, ctrl.crear)
router.post('/:id/unirse',    authMiddleware, ctrl.unirse)
router.post('/:id/salir',     authMiddleware, ctrl.salir)
router.post('/:id/publicar',  authMiddleware, ctrl.publicar)
router.post('/:id/publicaciones/:pubId/comentar', authMiddleware, ctrl.comentar)
router.post('/:id/publicaciones/:pubId/like',     authMiddleware, ctrl.likePublicacion)

export default router
