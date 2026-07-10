import { Router } from 'express'
import { FeedController } from '../controllers/FeedController'
import { authMiddleware } from '../../infrastructure/auth/SupabaseAuthMiddleware'

const router = Router()
const ctrl   = new FeedController()

router.get('/', authMiddleware, ctrl.getFeed)

export default router
