import { updateHostSettings } from '../controllers/hostSettingsController';
import { getHostSettings } from '../controllers/hostSettingsController';
import { Router } from 'express';
import { addHostSettings } from '../controllers/hostSettingsController';
//   } = req.body;

const router = Router();

router.post('/', updateHostSettings);
router.get('/', getHostSettings);
router.post('/add', addHostSettings);

export default router;
