import { Router } from 'express'
import { RankingController } from '../controllers/RankingController'

const router = Router()
const ctrl = new RankingController()

router.get('/', ctrl.global)
router.get('/temporada', ctrl.temporada)
router.get('/mas-vistos', ctrl.masVistos)
router.get('/mas-gustados', ctrl.masGustados)

export default router
