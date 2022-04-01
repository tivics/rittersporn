require("dotenv").config()
const {Client} = require("discord.js")
const client = new Client({intents:["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES"]})
const { joinVoiceChannel, createAudioPlayer } = require('@discordjs/voice')
const play = require('./play')
const player = createAudioPlayer()

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
        play.play_youtube(url ,message, connection, player)
    }
    else if(message.content === '!stop') {
        player.stop()
        setTimeout(() => message.delete(), 10000)    
    }
})
client.login(process.env.DISCORD_BOT_TOKEN)