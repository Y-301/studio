// backend/src/routes/deviceRoutes.ts
import express from 'express';
import * as deviceController from '../controllers/deviceController';

const router = express.Router();

// GET /api/devices - Get all devices for the authenticated user
router.get('/', deviceController.getAllDevices);

// POST /api/devices - Add a new device
router.post('/', deviceController.createDevice);

// GET /api/devices/:deviceId - Get a specific device by ID
router.get('/:deviceId', deviceController.getDeviceById);

// PUT /api/devices/:deviceId - Update an existing device
router.put('/:deviceId', deviceController.updateDevice);

// DELETE /api/devices/:deviceId - Delete a device
router.delete('/:deviceId', deviceController.deleteDevice);

// POST /api/devices/:deviceId/control - Control a device (e.g., on/off, brightness)
router.post('/:deviceId/control', deviceController.controlDevice);


export default router;
