const { fetchWithRetries } = require('./util')

const PRAYER_TIMES_API = 'https://us-central1-mai-subscriptions-web-app.cloudfunctions.net/api/prayers'

async function fetchPrayerTimes(month, day) {
    const prayerTimes = await fetchWithRetries(`${PRAYER_TIMES_API}/${month}/${day}`)
    return prayerTimes
}

module.exports = {
    fetchPrayerTimes,
}