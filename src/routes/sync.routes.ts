
import { Router } from 'express';
import { authenticate } from '../middleware/auth';   // AuthRequest убрали

 import {
   syncData,
   downloadData,
   wipeData,
   getSyncStatus,
 } from '../controllers/sync.controller';

 const router = Router();

 router.post   ('/upload',   authenticate, syncData);       // PUSH
 router.get    ('/download', authenticate, downloadData);   // PULL
 router.delete ('/wipe',     authenticate, wipeData);       // ⚡ полный сброс
 router.get    ('/status',   authenticate, getSyncStatus);  // инфо

 export default router;
