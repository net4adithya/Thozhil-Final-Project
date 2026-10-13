module.exports = {
  apps: [
    {
      name: 'assessment-api',
      script: 'src/server.js',
      cwd: '/var/www/projects/assessment-platform/assessment-backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5003,
      },
    },
  ],
};
