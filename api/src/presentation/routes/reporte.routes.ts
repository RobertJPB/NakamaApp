import { Router } from 'express'
import { ReporteController } from '../controllers/ReporteController'
import { authMiddleware } from '../../infrastructure/auth/SupabaseAuthMiddleware'

const router = Router()
const ctrl = new ReporteController()

router.post('/', authMiddleware, ctrl.crearReporte)

export default router
