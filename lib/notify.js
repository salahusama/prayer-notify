const player = require('play-sound')()
const notifier = require('node-notifier')
const { LOG } = require('./util')

const AUDIO_ADHAN = '../audio/adhan-delay.mp3'
const AUDIO_REMINDER_VERSE = '../audio/verse-6-91-cut-delay.mp3'
const AUDIO_REMINDER_KHALED = '../audio/khaled-alrashed-reminder.mp3'
const AUDIO_REMINDERS = [AUDIO_REMINDER_VERSE, AUDIO_REMINDER_KHALED]
const AUDIO_STARTUP = '../audio/startup.mp3'

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

function sendStartupNotification() {
    sendNotification({ title: 'Service Started: prayer-notify' }, AUDIO_STARTUP)
}

function sendPrayerNotification({ name, hours, minutes }) {
    const usedName = name === 'Shurooq' ? name : `${name} prayer`
    sendNotification({
        title: name,
        message: `It's time for ${usedName} (${hours}:${minutes}).`,
    }, AUDIO_ADHAN)
}

function sendReminderNotification(prayerName, nextPrayer, remainingTimeMsg) {
    const name = nextPrayer.name === 'Shurooq' ? nextPrayer.name : `${nextPrayer.name} prayer`
    const audio = AUDIO_REMINDERS[Math.floor((Math.random() * AUDIO_REMINDERS.length))]
    sendNotification({
        title: `Don't miss ${prayerName}!`,
        message: `${name} is in ${remainingTimeMsg}! (${nextPrayer.hours}:${nextPrayer.minutes}).`,
    }, audio)
}

module.exports = {
    sendStartupNotification,
    sendPrayerNotification,
    sendReminderNotification,
}
