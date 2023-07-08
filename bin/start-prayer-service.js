#!/usr/bin/env -S node --no-warnings

const pm2 = require('pm2')

pm2.start({
  name: 'prayer-notify',
  instances: 1,
  exec_mode: 'fork',
  script: 'prayer-notify',
}, (err) => {
  if (err) {
    console.error('Error starting process:', err)
  } else {
    console.log('Process started successfully!')
  }

  pm2.disconnect()
})
