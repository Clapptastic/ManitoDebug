const express = require('express');
const router = express.Router();
const { getSystemHealth, getDatabaseHealth, getRedisHealth } = require('../services/healthService');

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Get basic health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'admin-panel-api',
      version: process.env.APP_VERSION || '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/health/detailed:
 *   get:
 *     summary: Get detailed health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Detailed health information
 */
router.get('/detailed', async (req, res) => {
  try {
    const health = await getSystemHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/health/database:
 *   get:
 *     summary: Get database health status
 *     tags: [Health]
 */
router.get('/database', async (req, res) => {
  try {
    const health = await getDatabaseHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      component: 'database',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/health/redis:
 *   get:
 *     summary: Get Redis health status
 *     tags: [Health]
 */
router.get('/redis', async (req, res) => {
  try {
    const health = await getRedisHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      component: 'redis',
      error: error.message
    });
  }
});

module.exports = router;