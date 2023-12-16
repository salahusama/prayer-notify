# 🇮🇪 prayer-notify 🇮🇪

`prayer-notify` is an npm service which runs in the background and plays the adhan at prayer times. It currently only uses Irish prayer times but could be expanded in the future.

It also plays a reminder notification 20 minutes before the next prayer. This reminder is verse [6:91](https://quran.com/6/91).

_**Experimental:** Depending on your system, a notification may also be shown._

### Requirements
- git - https://git-scm.com/book/en/v2/Getting-Started-Installing-Git
- nodejs - https://nodejs.org/en/download
- npm _(installed with nodejs)_

### Installation

```
git clone https://github.com/salahusama/prayer-notify
cd prayer-notify
npm install
sudo npm install -g .
```

### Usage

*Note:* You may need to restart your terminal window to get the updated path.

To **start** the background service:

```
prayer-notify-start
```

To **stop** the background service:

```
prayer-notify-stop
```

You can also just run a single instance. i.e. It will stop when interrupted or the terminal window is closed _(not recommended)_:

```
prayer-notify
```

### Caveats

Please note that you will need to restart the service using `prayer-notify-start` after a system reboot.