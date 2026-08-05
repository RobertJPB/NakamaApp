import { Router } from 'express'
import { ComunidadController } from '../controllers/ComunidadController'
import { authMiddleware } from '../../infrastructure/auth/SupabaseAuthMiddleware'
import { validate } from '../middlewares/validate.middleware'
import { crearComunidadSchema, postFeedSchema } from '../validations/schemas'

const router = Router()
const ctrl   = new ComunidadController()

router.get('/',                             ctrl.listar)
router.get('/buscar',                       ctrl.buscar)
router.get('/:id',                          ctrl.detalle)
router.get('/:id/publicaciones',            ctrl.publicaciones)
router.post('/',              authMiddleware, validate(crearComunidadSchema), ctrl.crear)
router.put('/:id',            authMiddleware, validate(crearComunidadSchema), ctrl.editar)
router.delete('/:id',         authMiddleware, ctrl.eliminar)
router.post('/:id/unirse',    authMiddleware, ctrl.unirse)
router.post('/:id/salir',     authMiddleware, ctrl.salir)
router.post('/:id/publicar',  authMiddleware, validate(postFeedSchema), ctrl.publicar)
router.get('/:id/miembros',                ctrl.listarMiembros)
router.delete('/:id/miembros/:usuarioId',    authMiddleware, ctrl.expulsarMiembro)
router.patch('/:id/miembros/:usuarioId/rol', authMiddleware, ctrl.cambiarRol)

router.delete('/publicaciones/:pubId', authMiddleware, ctrl.eliminarPublicacion)
router.put('/publicaciones/:pubId', authMiddleware, ctrl.editarPublicacion)
router.post('/:id/publicaciones/:pubId/comentar', authMiddleware, ctrl.comentar)
router.post('/:id/publicaciones/:pubId/like',     authMiddleware, ctrl.likePublicacion)
router.post('/votar-encuesta',                    authMiddleware, ctrl.votarEncuesta)

export default router
