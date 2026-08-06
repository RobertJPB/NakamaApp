import { Router } from 'express'
import { PlantillaController } from '../controllers/PlantillaController'
import { authMiddleware } from '../../infrastructure/auth/SupabaseAuthMiddleware'
import { container } from '../../infrastructure/container'

const router = Router()
const ctrl   = new PlantillaController(container.plantillaRepo)

router.get('/', ctrl.listar)
router.post('/', authMiddleware, ctrl.crear)

export default router
