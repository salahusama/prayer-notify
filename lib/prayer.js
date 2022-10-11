const player = require('play-sound')()
const notifier = require('node-notifier')
const Logger = require('simple-node-logger')

const LOG = Logger.createSimpleLogger({ timestampFormat:'YYYY-MM-DD HH:mm:ss' })

const PRAYER_TIMES_API = 'https://islamireland.ie/api/timetable/'
const PRAYER_NAMES = ['Fajr', 'Shurooq', 'Duhr', 'Asr', 'Maghrib', 'Isha']

const REMINDER_TIME_MS = 20 * 60_000 // 20 minutes

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function fetchPrayerTimes(month, day) {
    const resp = await fetch(PRAYER_TIMES_API)
    const data = await resp.json()

    const times = data.timetable[month][day]

    const prayerTimes = []
    times.forEach((time, i) => {
        prayerTimes.push({
            name: PRAYER_NAMES[i],
            hours: time[0],
            minutes: time[1],
        })
    })

    return prayerTimes
}

function sendNotification({ title, message=' ' }, audioFile) {
    notifier.notify({
        title: '🕌 ' + title,
        message,
        actions: ['Dismiss'],
    })
    if (audioFile) {
        const absolutePath = __dirname + '/' + audioFile
        const audio = player.play(absolutePath, (err) => { if (err && !err.killed) LOG.error('Error playing audio: ', err) })
        notifier.on('click', () => audio.kill())
    }
}

function sendPrayerNotification({ name, hours, minutes }) {
    sendNotification({
        title: name,
        message: `It's time for ${name} prayer (${hours}:${minutes}).`,
    }, '../audio/adhan.mp3')
}

function sendReminderNotification(prayerName, nextPrayer) {
    sendNotification({
        title: `Don't miss ${prayerName}!`,
        message: `${nextPrayer.name} prayer is in 20 minutes! (${nextPrayer.hours}:${nextPrayer.minutes}).`,
    }, __dirname + '../audio/verse-6-91-cut.mp3')
}

function getMilliSecondsUntil(hours, minutes, dayOffset=0) {
    const now = new Date()
    const then = new Date(now)
    then.setDate(then.getDate() + dayOffset)
    then.setHours(hours)
    then.setMinutes(minutes)
    return (then.getTime() - now.getTime() )
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
                        setTimeout(() => sendReminderNotification(prevPrayer, prayer), msUntilReminder)
                    }
                }
            }
        }

        // We don't schedule a prayer notification for Shurooq
        if (name === 'Shurooq') {
            return
        }

        LOG.info(`Scheduling prayer notification for ${name} at ${hours}:${minutes}`)
        setTimeout(() => sendPrayerNotification(prayer), msUntilPrayer)
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
