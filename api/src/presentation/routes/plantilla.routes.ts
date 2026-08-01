import { Router } from 'express'
import { PlantillaController } from '../controllers/PlantillaController'
import { authMiddleware } from '../../infrastructure/auth/SupabaseAuthMiddleware'

const router = Router()
const ctrl   = new PlantillaController()

router.get('/', ctrl.listar)
router.post('/', authMiddleware, ctrl.crear)

export default router
