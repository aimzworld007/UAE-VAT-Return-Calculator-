import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import * as c from '../controllers/appController.js';

const router = Router();

router.get('/summary', asyncHandler(c.adminStats));
router.get('/smtp-settings', asyncHandler(c.getSmtp));
router.put('/smtp-settings', asyncHandler(c.putSmtp));
router.get('/audit-logs', asyncHandler(c.adminAuditLogs));
router.get('/users', asyncHandler(c.adminUsers));
router.get('/users/:id', asyncHandler(c.adminUser));

export default router;
