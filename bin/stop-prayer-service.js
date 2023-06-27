#!/usr/bin/env node --no-warnings

const pm2 = require('pm2')

pm2.stop('prayer-notify', (err) => {
  if (err) {
    console.error('Error stopping process:', err)
  } else {
    console.log('Process stopped successfully!')

    pm2.delete('prayer-notify', (err) => {
      if (err) {
        console.error('Error deleting process:', err)
      } else {
        console.log('Process deleted successfully!')
      }
  
      pm2.disconnect()
    })
  }
})

