const player = require('play-sound')()
const notifier = require('node-notifier')
const { LOG } = require('./util')

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
    }, '../audio/verse-6-91-cut.mp3')
}

module.exports = {
    sendNotification,
    sendPrayerNotification,
    sendReminderNotification,
}
