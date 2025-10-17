const express = require('express');
const searchRouter = require('./search');
const tracksRouter = require('./tracks');
const mediaRouter = require('./media');
const entitiesRouter = require('./entities');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

router.use('/search', searchRouter);
router.use('/tracks', tracksRouter);
router.use('/', mediaRouter);
router.use('/', entitiesRouter);

module.exports = router;

