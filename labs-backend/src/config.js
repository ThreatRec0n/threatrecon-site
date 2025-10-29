// config.js - Environment configuration
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  logLevel: process.env.LOG_LEVEL || 'info',
  sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600000', 10),
  simTargetIP: process.env.SIM_TARGET_IP || '10.0.10.5',
  simTargetHost: process.env.SIM_TARGET_HOST || 'corp-target'
};

