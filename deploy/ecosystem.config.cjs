module.exports = {
  apps: [
    {
      name: 'smart-hr-backend',
      cwd: '/var/www/smart-helper/server',
      script: 'dist/src/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '800M',
      env: {
        NODE_ENV: 'production',
        PORT: 3200,
      },
    },
  ],
};
