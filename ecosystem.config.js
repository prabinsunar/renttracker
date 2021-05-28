module.exports = {
  apps: [{
    name: 'renttracker',
    script: './app.js'
  }],
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'ec2-18-222-51-160.us-east-2.compute.amazonaws.com',
      key: '~/.ssh/rent-tracker.pem',
      ref: 'origin/main',
      repo: 'https://github.com/prabinsunar/renttracker.git',
      path: '/home/ubuntu/renttracker',
      'post-deploy': 'npm install && pm2 startOrRestart ecosystem.config.js'
    }
  }
}
