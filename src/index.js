require("dotenv").config()
const { Client, GatewayIntentBits, Partials, ChannelType } = require('discord.js');

// Keine GUILD_MEMBERS oder andere privilegierten Intents nötig, GuildVoiceStates für !join/!play/!stop
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,          // Zugriff auf Guilds
        GatewayIntentBits.GuildMessages,   // Zugriff auf Nachrichten in Textchannels
        GatewayIntentBits.MessageContent,  // Zugriff auf Message Content (für .send und Lesen)
        GatewayIntentBits.GuildVoiceStates // Zugriff auf Voice-Channel-Zugehörigkeit der Mitglieder
    ],
    partials: [Partials.Channel]           // Falls Threads oder DM-Channels
});
const { joinVoiceChannel, getVoiceConnection, entersState, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, NoSubscriberBehavior, StreamType } = require('@discordjs/voice')
const { spawn } = require('node:child_process')
require('ffmpeg-static') // wird von @discordjs/voice (prism-media) automatisch zum Transkodieren gefunden

const express = require('express')
const cors = require('cors')
const port = 3000

var news = require('./news.js');
var news_handler
var twitter_handler

//-----YOUTUBE-AUDIO-----
// Direkte YouTube-Stream-URLs sind seit YouTubes SABR-Rollout (07/2025) faktisch nicht mehr
// abrufbar (weder über ytdl-core/play-dl noch direkt über youtubei.js). yt-dlp löst PO-Tokens/SABR
// selbst und wird sehr aktiv gepflegt, daher läuft die Extraktion hier extern über die yt-dlp-Binary.
const YTDLP_PATH = process.env.YTDLP_PATH || 'yt-dlp'

let currentPlayer = null
let nextTrack = false

//liefert den rohen Audio-Stream (stdout) eines yt-dlp-Prozesses für eine URL oder Suchanfrage
function getAudioStream(query) {
    return new Promise((resolve, reject) => {
        const target = /^https?:\/\//i.test(query) ? query : `ytsearch1:${query}`

        const proc = spawn(YTDLP_PATH, [
            '-f', 'bestaudio',
            '--no-playlist',
            '--no-warnings',
            '-o', '-',
            target
        ])

        let stderr = ''
        let resolved = false

        // 'readable' statt 'data' abhören, damit der Stream im pausierten Modus bleibt und
        // createAudioResource später alle Daten (inkl. der ersten Chunks) erhält
        proc.stdout.once('readable', () => {
            resolved = true
            resolve(proc.stdout)
        })

        proc.stderr.on('data', chunk => { stderr += chunk })

        proc.on('error', err => {
            reject(new Error(`yt-dlp konnte nicht gestartet werden (ist es installiert?): ${err.message}`))
        })

        proc.on('close', code => {
            if (!resolved) {
                reject(new Error(code === 0 ? 'yt-dlp lieferte keine Audiodaten' : (stderr.trim().split('\n').pop() || `yt-dlp beendete sich mit Code ${code}`)))
            }
        })
    })
}

async function playMusic(guildId, channelId, adapterCreator, query) {
    const stream = await getAudioStream(query)
    const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary })

    // bestehende Verbindung wiederverwenden statt erneut joinVoiceChannel() aufzurufen
    // (ein zweiter Aufruf für dieselbe Guild lässt die Verbindung neu aushandeln und
    // kann sie zwischen 'connecting' und 'signalling' hin- und herspringen lassen)
    const connection = getVoiceConnection(guildId) || joinVoiceChannel({
        channelId,
        guildId,
        adapterCreator,
        selfMute: false,
        selfDeaf: false,
    })

    const player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Play
        }
    })

    connection.subscribe(player)

    if (connection.state.status !== VoiceConnectionStatus.Ready) {
        await entersState(connection, VoiceConnectionStatus.Ready, 15_000)
    }

    player.play(resource)
    currentPlayer = player
    nextTrack = false

    player.on('error', error => {
        console.error(`Player-Fehler: ${error.message}`)
        setTimeout(() => connection.disconnect(), 10000)
    })

    player.once(AudioPlayerStatus.Idle, () => {
        if (!nextTrack) {
            setTimeout(() => connection.disconnect(), 10000)
        }
    })
}

// stoppt einen laufenden Track (ohne die Verbindung zu trennen) und startet den neuen
async function startTrack(guildId, channelId, adapterCreator, query) {
    if (currentPlayer?.state.status === AudioPlayerStatus.Playing) {
        nextTrack = true
        currentPlayer.stop()
    }
    await playMusic(guildId, channelId, adapterCreator, query)
}
//----------------------

//-------REST-API-------
const app = express()
app.use(cors())
app.listen(port, () => {
    console.log(`Rittersporn listening on port: ${port}`)
})

//play
app.get('/play', async function(req, res) {
    try {
        const guild = await client.guilds.fetch(req.query.guildID)
        await startTrack(guild.id, req.query.channelID, guild.voiceAdapterCreator, req.query.url)
        res.send('playing')
    } catch (err) {
        res.status(500).send(`Fehler: ${err.message}`)
    }
})

//search & play (die Suche läuft intern über yt-dlp, kein separater Suchschritt nötig)
app.get('/search', async function(req, res) {
    try {
        const guild = await client.guilds.fetch(req.query.guildID)
        await startTrack(guild.id, req.query.channelID, guild.voiceAdapterCreator, req.query.searchTerm)
        res.send('search & play')
    } catch (err) {
        res.status(500).send(`Fehler: ${err.message}`)
    }
})

//submit discord channels
app.get('/channel', function(req, res) {
    const channels = client.channels.cache
        .filter(channel => channel.type === ChannelType.GuildVoice)
        .map(channel => ({
            id: channel.id,
            name: channel.name,
            guildId: channel.guildId,
            guildName: channel.guild.name
        }))
    res.send(channels)
})
//----------------------

//-------DISCORD--------
client.login(process.env.DISCORD_BOT_TOKEN)
//init
client.on('clientReady', async client => {
    //refresh rss feed every minute
    //news_handler = setInterval(function(){news.read_rss(client)}, 60000);

    //refresh twitter feed every 15 minutes ***UPDATE twitter api needs to be paid since mid of 2023**
    //twitter_handler = setInterval(function(){news.read_twitter(client)}, 900000)
    })
//set message listener
client.on('messageCreate', async (message) => {

    if(message.content === '!join') {
        const voiceChannel = message.member.voice.channel
        if(voiceChannel) {
            joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
                selfMute: false,
                selfDeaf: false,
            })
        } else {
            message.reply('Du musst in einem Voice-Channel sein.')
        }
    }
    else if(message.content.slice(0, 6) === '!play ') {
        const query = message.content.slice(6).trim()
        const voiceChannel = message.member.voice.channel

        if(!voiceChannel) {
            message.reply('Du musst in einem Voice-Channel sein.')
        } else if(query) {
            try {
                await startTrack(message.guild.id, voiceChannel.id, message.guild.voiceAdapterCreator, query)
            } catch (err) {
                message.reply(`Fehler: ${err.message}`)
            }
        }
        //delete message to keep channel clean
        setTimeout(() => message.delete(), 10000)
    }
    else if(message.content === '!stop') {
        nextTrack = false
        currentPlayer?.stop()
        //delete message to keep channel clean
        setTimeout(() => message.delete(), 10000)
    }
    if(message.content.startsWith('!delete')) {
        await message.channel.messages.fetch({limit: 100}).then(messages => {
            messages.forEach(message =>{
                message.delete()
            })
        })
    }
})

  //catch every not handled exception
process.on('uncaughtException', err => {
    console.error(err && err.stack)
})