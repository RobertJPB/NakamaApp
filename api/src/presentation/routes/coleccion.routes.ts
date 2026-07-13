import { Router } from 'express'
import { ColeccionController } from '../controllers/ColeccionController'
import { authMiddleware } from '../../infrastructure/auth/SupabaseAuthMiddleware'

const router = Router()
const ctrl   = new ColeccionController()

router.get('/editoriales',                       ctrl.editoriales)
router.get('/usuario/:usuarioId',                ctrl.porUsuario)
router.get('/:id',                               ctrl.detalle)
router.post('/',                  authMiddleware, ctrl.crear)
router.put('/:id',                authMiddleware, ctrl.editar)
router.delete('/:id',             authMiddleware, ctrl.eliminar)
router.post('/:id/animes',        authMiddleware, ctrl.agregarAnime)
router.delete('/:id/animes/:animeId', authMiddleware, ctrl.quitarAnime)

export default router
