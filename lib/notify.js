const player = require('play-sound')()
const notifier = require('node-notifier')
const { LOG } = require('./util')

const AUDIO_ADHAN = '../audio/adhan-delay.mp3'
const AUDIO_REMINDER = '../audio/verse-6-91-cut-delay.mp3'
const AUDIO_WARNING = 'verse-19-59-warning.mp3'
const AUDIO_STARTUP = '../audio/startup.mp3'
const AUDIO_FRIDAY = '../audio/verse-62-9-friday.mp3'

const reminderAudioList = [AUDIO_REMINDER, AUDIO_WARNING]
const getRandomReminderAudio = () => reminderAudioList[parseInt(Math.random() * 10) % reminderAudioList]

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
    sendNotification({
        title: `Don't miss ${prayerName}!`,
        message: `${name} is in ${remainingTimeMsg}! (${nextPrayer.hours}:${nextPrayer.minutes}).`,
    }, getRandomReminderAudio())
}

function sendFridayNotification() {
    sendNotification({
        title: 'Prepare for Friday Prayer',
        message: 'Today is Friday. Get ready for Friday prayer.',
    }, AUDIO_FRIDAY)
}

module.exports = {
    sendStartupNotification,
    sendPrayerNotification,
    sendReminderNotification,
    sendFridayNotification,
}
