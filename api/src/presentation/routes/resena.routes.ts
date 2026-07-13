import { Router } from 'express'
import { ResenaController } from '../controllers/ResenaController'
import { authMiddleware } from '../../infrastructure/auth/SupabaseAuthMiddleware'

const router = Router()
const ctrl   = new ResenaController()

router.get('/anime/:animeId',            ctrl.porAnime)
router.get('/usuario/:usuarioId',        ctrl.porUsuario)
router.post('/',         authMiddleware, ctrl.crear)
router.put('/:id',       authMiddleware, ctrl.editar)
router.delete('/:id',    authMiddleware, ctrl.eliminar)
router.post('/:id/like', authMiddleware, ctrl.toggleLike)

export default router
