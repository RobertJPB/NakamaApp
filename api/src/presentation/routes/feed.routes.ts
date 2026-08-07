import { Router } from 'express'
import { FeedController } from '../controllers/FeedController'
import { authMiddleware } from '../../infrastructure/auth/SupabaseAuthMiddleware'
import { validate } from '../middlewares/validate.middleware'
import { postFeedSchema, comentarioSchema } from '../validations/schemas'

const router = Router()
const ctrl = new FeedController()

router.get('/', authMiddleware, ctrl.getFeed)
router.post('/', authMiddleware, validate(postFeedSchema), ctrl.postFeed)
router.delete('/:tipo/:id', authMiddleware, ctrl.deleteFeedItem)
router.post('/:tipo/:id/like', authMiddleware, ctrl.toggleLike)

router.get('/:tipo/:id/comentarios', ctrl.getComments)
router.post('/:tipo/:id/comentarios', authMiddleware, validate(comentarioSchema), ctrl.postComment)
router.delete('/:tipo/:id/comentarios/:comentarioId', authMiddleware, ctrl.deleteComment)

export default router
