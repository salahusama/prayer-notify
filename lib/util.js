const Logger = require('simple-node-logger')
const axios = require('axios')

const LOG = Logger.createSimpleLogger({ timestampFormat:'YYYY-MM-DD HH:mm:ss' })

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Checks if the {targetTimeMs} matches the time now.
 * 
 * This is required as we schedule tasks to run at certain times, and sometimes the actual tasks
 * gets executed by the scheduler at the wrong time.
 * 
 * @param {number} targetTimeMs 
 * @returns {boolean}
 */
function isCorrectTime(targetTimeMs) {
    const now = new Date().getTime()
    // Return true if difference is less than 5s
    const isWithinRange = (now - targetTimeMs) < 5000
    if (!isWithinRange) {
        LOG.warn('Missed a notification.')
    }
    return isWithinRange
}

function getMilliSecondsUntil(hours, minutes, dayOffset=0) {
    const now = new Date()
    const then = new Date(now)
    then.setDate(then.getDate() + dayOffset)
    then.setHours(hours)
    then.setMinutes(minutes)
    return (then.getTime() - now.getTime() )
}

async function retry(call, { retries = 3, delayMs = 1000 } = {}) {
    try {
        const result = await call()
        return result
    } catch (err) {
        if (retries === 0) {
            LOG.error(err)
            throw new Error('Max retries reached')
        }
        LOG.info(`Retries remaining: ${retries}`)
        await sleep(delayMs)
        return retry(call, { retries: retries - 1, delayMs })
    }
}

async function fetchWithRetries(url, options = {}) {
    // Note: We can't use fetch as it is not supported in earlier node versions
    // const apiCall = async () => await fetch(url, options)
    const apiCall = async () => await axios({
        url,
        method: 'get',      // default
        data: options.body, // accept body as data if it was provided
        ...options,
    })
    const resp = await retry(apiCall)
    return await resp.data
}

module.exports = {
    LOG,
    sleep,
    isCorrectTime,
    getMilliSecondsUntil,
    fetchWithRetries,
}
