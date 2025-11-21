/**
 * PM2 Ecosystem Configuration for Raspberry Pi 5
 * 
 * This configuration file defines how PM2 should run the Pet Training Bot
 * on your Raspberry Pi 5 with production settings.
 */

module.exports = {
  apps: [
    {
      name: 'pet-trainer-bot',
      script: './build/index.js',
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        // TEST_MODE: 'false', // Uncomment to explicitly disable test mode
      },
      
      // Process management
      instances: 1, // Single instance (bot doesn't need clustering)
      exec_mode: 'fork', // Fork mode (not cluster)
      
      // Auto-restart configuration
      autorestart: true,
      watch: false, // Don't watch files in production
      max_memory_restart: '200M', // Restart if memory exceeds 200MB
      
      // Restart strategy
      min_uptime: '10s', // Minimum uptime before considering app stable
      max_restarts: 10, // Max restarts within 1 minute before giving up
      restart_delay: 4000, // Wait 4 seconds between restarts
      
      // Logging
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Advanced features
      kill_timeout: 5000, // Time to wait for graceful shutdown
      listen_timeout: 3000, // Time to wait for app to be ready
      
      // Environment-specific settings
      env_production: {
        NODE_ENV: 'production',
      },
      env_test: {
        NODE_ENV: 'production',
        TEST_MODE: 'true',
      },
    },
  ],
  
  // Deployment configuration (optional - for automated deployments)
  deploy: {
    production: {
      user: 'pi', // Change this to your Pi username if different
      host: 'raspberrypi.local', // Change to your Pi's hostname or IP
      ref: 'origin/main',
      repo: 'https://github.com/lbrulet/PetTrainerNotificationBot.git',
      path: '/home/pi/apps/pet-trainer-bot',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': 'mkdir -p /home/pi/apps',
    },
  },
};

