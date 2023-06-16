const { fetchWithRetries } = require('./util')

const PRAYER_TIMES_API = 'https://europe-west2-mai-subscriptions-web-app.cloudfunctions.net/api/v2/prayers'

async function fetchPrayerTimes(month, day) {
    const prayerTimes = await fetchWithRetries(`${PRAYER_TIMES_API}/${month}/${day}`)
    return prayerTimes
}

module.exports = {
    fetchPrayerTimes,
}