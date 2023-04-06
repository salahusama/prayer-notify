const { fetchPrayerTimes } = require('./api')
const { sendNotification, sendPrayerNotification, sendReminderNotification } = require('./notify')
const { LOG, sleep, isCorrectTime, getMilliSecondsUntil } = require('./util')

const REMINDER_TIME_MS = 20 * 60_000 // 20 minutes

function schedule(task, msUntilCall) {
    const now = new Date().getTime()
    setTimeout(() => isCorrectTime(now + msUntilCall) && task(), msUntilCall)
}

async function schedulePrayerNotificationsForTheDay() {
    const date = new Date()
    const month = date.getMonth() + 1
    const day = date.getDate()

    LOG.info(`Fetching prayer times for today (${date}) ...`)
    const prayers = await fetchPrayerTimes(month, day)

    prayers.forEach((prayer, i) => {
        const { name, hours, minutes } = prayer

        const msUntilPrayer = getMilliSecondsUntil(hours, minutes)
        if (msUntilPrayer < 0) {
            // Prayer has already passed.
            return
        }

        // Schedule a reminder notification 20 minutes before this prayer for the previous prayer.
        // We don't schedule a reminder for Isha before Fajr – As that doesn't make sense.
        if (i > 0) {
            const prevPrayer = prayers[i-1].name

            // We don't schedule a reminder notification for Shurooq
            if (prevPrayer !== 'Shurooq') {
                const msUntilReminder = msUntilPrayer - REMINDER_TIME_MS

                // In case the next prayer is within 1 second of when we'd send the reminder,
                // we just don't send the reminder. This is to avoid the edge case where we send
                // the prayer and reminder notifications at the same time.
                if (msUntilPrayer - msUntilReminder > 1000) {
                    // In case there's less than 20 minutes left to this prayer already,
                    // we send the reminder for the previous prayer immediately.
                    if (msUntilReminder < 0) {
                        LOG.info(`Sending reminder notification for ${prevPrayer} now`)
                        sendReminderNotification(prevPrayer, prayer)
                    } else {
                        const timeOfReminder = new Date(new Date().getTime() + msUntilReminder)
                        LOG.info(`Scheduling reminder notification for ${prevPrayer} at ${timeOfReminder.toTimeString().slice(0, 5)}`)
                        schedule(() => sendReminderNotification(prevPrayer, prayer), msUntilReminder)
                    }
                }
            }
        }

        // We don't schedule a prayer notification for Shurooq
        if (name === 'Shurooq') {
            return
        }

        LOG.info(`Scheduling prayer notification for ${name} at ${hours}:${minutes}`)
        schedule(() => sendPrayerNotification(prayer), msUntilPrayer)
    })
}

async function start() {
    LOG.info('Starting service...')
    sendNotification({ title: 'Service Started: prayer-notify' })

    while (true) {
        LOG.info(`Scheduling prayer notifications for today (${new Date()}) ...`)
        await schedulePrayerNotificationsForTheDay()

        LOG.info(`Waiting until the next day to schedule notification...`)
        // Milliseconds until 00:10 the next day
        const msUntilTheDayEnds = getMilliSecondsUntil(0, 10, 1)
        await sleep(msUntilTheDayEnds)
    }
}

module.exports = { start }
