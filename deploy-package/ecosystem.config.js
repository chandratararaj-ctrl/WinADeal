module.exports = {
  apps: [
    {
      name: 'winadeal-backend',
      cwd: '/var/www/winadeal/backend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '400M',
      node_args: '--max-old-space-size=384',
      error_file: '/var/www/winadeal/logs/backend-error.log',
      out_file: '/var/www/winadeal/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
