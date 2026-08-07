import { Router } from 'express'
import { ResenaController } from '../controllers/ResenaController'
import { authMiddleware, authOpcional } from '../../infrastructure/auth/SupabaseAuthMiddleware'
import { validate } from '../middlewares/validate.middleware'
import { crearResenaSchema } from '../validations/schemas'

const router = Router()
const ctrl = new ResenaController()

router.get('/recientes', ctrl.recientes)
router.get('/buscar', ctrl.buscar)
router.get('/anime/:animeId', authOpcional, ctrl.porAnime)
router.get('/usuario/:usuarioId', authOpcional, ctrl.porUsuario)
router.post('/', authMiddleware, validate(crearResenaSchema), ctrl.crear)
router.post('/personaje/:personajeId', authMiddleware, ctrl.crearPersonaje)
router.put('/:id', authMiddleware, validate(crearResenaSchema), ctrl.editar)
router.delete('/:id', authMiddleware, ctrl.eliminar)
router.post('/:id/like', authMiddleware, ctrl.toggleLike)

export default router
