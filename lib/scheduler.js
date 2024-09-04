const { fetchPrayerTimes } = require('./api')
const {
    sendPrayerNotification,
    sendReminderNotification,
    sendStartupNotification,
    sendFridayNotification,
} = require('./notify')
const { LOG, sleep, isCorrectTime, getMilliSecondsUntil } = require('./util')

const REMINDER_OPTIONS = {
    _20_MINS: {
        msg: '20 minutes',
        timeMs: 20 * 60_000,
    },
    _60_MINS: {
        msg: '1 hour',
        timeMs: 60 * 60_000,
    },
}

function schedule(task, msUntilCall) {
    const now = new Date().getTime()
    setTimeout(() => isCorrectTime(now + msUntilCall) && task(), msUntilCall)
}

function scheduleReminderNotification(prevPrayer, nextPrayer, reminderOptions, sendImmediatelyIfPast = false) {
    const prevPrayerName = prevPrayer.name
    const msUntilPrayer = getMilliSecondsUntil(nextPrayer.hours, nextPrayer.minutes)
    const msUntilReminder = msUntilPrayer - reminderOptions.timeMs

    // In case the next prayer is within 60 seconds of when we'd send the reminder,
    // we just don't send the reminder. This is to avoid the edge case where we send
    // the prayer and reminder notifications at the same time.
    if (msUntilPrayer - msUntilReminder < 60_000) {
        return
    }

    // In case there's less than reminderTimeMs left to this prayer already,
    // we send the reminder for the previous prayer immediately.
    // This is option is behind a flag (sendImmediatelyIfPast) controlled by the caller.
    if (sendImmediatelyIfPast && msUntilReminder < 0) {
        const minsUntilPrayer = parseInt(msUntilPrayer / 60_000)
        const message = minsUntilPrayer === 1 ? 'minute' : 'minutes'
        LOG.info(`Sending reminder notification for ${prevPrayerName} now`)
        sendReminderNotification(prevPrayerName, nextPrayer, `${minsUntilPrayer} ${message}`)
        return
    }
    
    const timeOfReminder = new Date(new Date().getTime() + msUntilReminder)
    LOG.info(`Scheduling ${reminderOptions.msg} reminder notification for ${prevPrayerName} at ${timeOfReminder.toTimeString().slice(0, 5)}`)
    schedule(() => sendReminderNotification(prevPrayerName, nextPrayer, reminderOptions.msg), msUntilReminder)
}

async function schedulePrayerNotificationsForTheDay() {
    const date = new Date()
    const month = date.getMonth() + 1
    const day = date.getDate()

    LOG.info(`Fetching prayer times for today (${date}) ...`)
    const prayers = await fetchPrayerTimes(month, day)

    prayers.forEach((prayer, i) => {
        const { name, hours, minutes, disabled } = prayer

        const msUntilPrayer = getMilliSecondsUntil(hours, minutes)
        if (msUntilPrayer < 0) {
            // Prayer has already passed.
            return
        }

        // Schedule reminder notifications for the previous prayer 20 minutes before this prayer.
        // We don't schedule a reminder for Isha before Fajr – As that doesn't make sense.
        // We don't schedule a reminder notification for Shurooq.
        // We don't schedule a reminder notification for Maghrib when Isha is disabled.
        if (i > 0 && prayers[i-1].name !== 'Shurooq' && !disabled) {
            scheduleReminderNotification(prayers[i-1], prayer, REMINDER_OPTIONS._20_MINS, true /* sendImmediatelyIfPast */)
        }

        // We don't schedule a prayer notification for Shurooq.
        // We don't schedule a prayer notification for disabled prayers.
        // disabled is true for Isha when it's being combined with Maghrib.
        if (name === 'Shurooq' || disabled) {
            return
        }

        LOG.info(`Scheduling prayer notification for ${name} at ${hours}:${minutes}`)
        schedule(() => sendPrayerNotification(prayer), msUntilPrayer)
    })
}

function scheduleFridayNotification() {
    const msUntilTime = getMilliSecondsUntil(12, 45)
    LOG.info(`Scheduling Friday notification at 12:45`)
    schedule(() => sendFridayNotification(), msUntilTime)
}

async function start() {
    LOG.info('Starting service...')
    sendStartupNotification()

    while (true) {
        const today = new Date()
        LOG.info(`Scheduling prayer notifications for today (${today}) ...`)
        await schedulePrayerNotificationsForTheDay()

        // Check if Friday
        if (today.getDay() === 5) {
            scheduleFridayNotification()
        }

        LOG.info(`Waiting until the next day to schedule notification...`)
        // Milliseconds until 00:10 the next day
        const msUntilTheDayEnds = getMilliSecondsUntil(0, 10, 1)
        await sleep(msUntilTheDayEnds)
    }
}

module.exports = { start }
