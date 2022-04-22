require("dotenv").config()
const {Client} = require("discord.js")
const client = new Client({intents:["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES"]})
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice')
const ytdl  = require('ytdl-core')
var player = createAudioPlayer()
var news = require('./news.js')
var news_handler
var twitter_handler

client.on('messageCreate', async (message) => {
    if(message.content === '!join') {
        joinVoiceChannel({
            channelId: message.member.voice.channel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
            selfMute: false,
            selfDeaf: false,
        })
    }
    else if(message.content.slice(0, 6) === '!play ') {
        
        var url = message.content.slice(6)
        
        connection = joinVoiceChannel({
            channelId: message.member.voice.channel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
            selfMute: false,
            selfDeaf: false,
        })      

        const stream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1024 * 1024 * 10 ,liveBuffer: 4000 }) // Buffergröße 10MB für Videos und 4 anstatt 2 Sekunden für Live Streams
        const resource = createAudioResource(stream, { inlineVolume: false/*true*/ }) //todo performante Lösung für Lautstärkeregelung
        //resource.volume.setVolume(0.1)

        player.play(resource)
     
        connection.subscribe(player)    
        setTimeout(() => message.delete(), 10000)
        
        clearInterval(news_handler)
        clearInterval(twitter_handler)
        news_handler = 0
        twitter_handler = 0

        //error handler, nachricht ausgeben und channel verlassen
        player.on('error', error => {
            console.error(`Error: ${error.message}`);
            setTimeout(() => connection.disconnect(), 10000)
            if(news_handler === 0 && twitter_handler === 0){
                news_handler = setInterval(function(){news.read_rss(client)}, 60000)
                twitter_handler = setInterval(function(){news.read_twitter(client)}, 60000)
            }
        })
        //wenn fertig channel verlassen
        player.on(AudioPlayerStatus.Idle, () => {
            setTimeout(() => connection.disconnect(), 10000)
            if(news_handler === 0 && twitter_handler === 0){
                news_handler = setInterval(function(){news.read_rss(client)}, 60000)
                twitter_handler = setInterval(function(){news.read_twitter(client)}, 60000)
            }
        })
    }
    else if(message.content === '!stop') {
        player.stop()
        setTimeout(() => message.delete(), 10000)    
    }
})

client.on('ready', async client => {
    news.read_rss(client)

/*
news_handler = setInterval(function(){news.read_rss(client)}, 60000)

twitter_handler = setInterval(function(){news.read_twitter(client)}, 60000)
*/
//news channel
//var news_channel = client.channels.cache.find(channel => channel.id === `961721436546949140`)
//hunt channel
//var hunt_channel = client.channels.cache.find(channel => channel.id === `961721387754606682`)
})

client.login(process.env.DISCORD_BOT_TOKEN)

//jede noch nicht abgefangene exception in der console ausgeben; Zwischenlösung da Twitter API immer wieder auf Fehler läuft 
process.on('uncaughtException', err => {
    console.error(err && err.stack)
});