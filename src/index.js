require("dotenv").config()
const {Client, MessageSelectMenu} = require("discord.js")
const client = new Client({
    intents:["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES"]
})
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior } = require('@discordjs/voice')
const ytdl  = require('ytdl-core')
const play = require('play-dl')
const axios = require('axios')
const tokens = []
const SpotifyWebApi = require('spotify-web-api-node')
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
  })
const express = require('express')
const port = 3000

var channels = []
var player = createAudioPlayer()
var news = require('./news.js')
var news_handler
var twitter_handler
var app = express()
var cors = require('cors')
var next = false

//-------REST-API-------
app.use(cors())
app.listen(port, () => {
    console.log(`Rittersporn listening on port:  ${port}`)
})

//play
app.get('/play', async function(req, res) {
  let guildID = req.query.guildID
  let channelID = req.query.channelID
  let url = req.query.url

  if(player.state.status != 'playing'){
    await playMusic(guildID, channelID, url, '')
  }else{
    next = true
    player.stop()
    await playMusic(guildID, channelID, url, '')
  }
  res.send(`playing`)
})

//search & play
app.get('/search', async function(req, res) {
  let guildID = req.query.guildID
  let channelID = req.query.channelID
  let searchTerm = req.query.searchTerm
  const searched = await searchMusic(searchTerm)

  if(player.state.status != 'playing'){
    await playMusic(guildID,channelID,'', searched)
  }else{
    next = true
    player.stop()
    await playMusic(guildID,channelID,'', searched)
  }
  res.send(`search & play`)
})

//submit discord channels
app.get('/channel', function(req, res) {
    channels = []
    client.channels.cache.forEach((item) => {
    if(item.type === 'GUILD_VOICE'){
        channels.push(item)
    }
    })
    res.send(channels)
  }) 
//----------------------

//-------DISCORD--------
client.login(process.env.DISCORD_BOT_TOKEN)
//init
client.on('ready', async client => {
    //refresh rss feed every minute
    news_handler = setInterval(function(){news.read_rss(client)}, 60000)
    //refres twitter feed every 15 minutes
    twitter_handler = setInterval(function(){news.read_twitter(client)}, 900000)
    /*
        //store spotify access token
        await axios({
            method: 'get',
            url: 'http://localhost:8888/access_token',
            responseType: 'text'
             }).then(function (res) {
                //console.log(res.data)
                let newItem = {
                    access_token: res.data,
                }
                tokens.push(newItem)
        })
    */
    })
//set message listener
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

        if(player.state.status != 'playing'){     
            await playMusic(message.guild.id, message.member.voice.channel.id, url, '')    
        }else{
            player.stop()
            await playMusic(message.guild.id, message.member.voice.channel.id, url, '')
        }
        //delete message to keep channel clean 
        setTimeout(() => message.delete(), 10000)
    }
    else if(message.content === '!stop') {
        player.stop()
        //delete message to keep channel clean 
        setTimeout(() => message.delete(), 10000)    
    }
    else if(message.content === '!delete') {
        /*await message.channel.messages.fetch({limit: 100}).then(messages =>{
            message.channel.bulkDelete(messages, true)
        })*/
        let count
        do{
            await message.channel.messages.fetch({limit: 100}).then(messages => {
                count =  messages.size
                messages.forEach(message =>{
                    message.delete()
                    count = count-1
            })
        })}while(count>=1);
    }
})
//----------------------

//-----PLAY&SEARCH------
async function searchMusic(searchTerm){
    let searched =  await play.search(searchTerm, { source : { youtube : "video" }, limit : 1, fuzzy : false }) // youtube video search
    return searched
  }
  
  async function playMusic(guildID, channelID, url, ytSearch){
    let guild = await client.guilds.fetch(guildID)
    let connection = joinVoiceChannel({
        channelId: channelID,
        guildId: guildID,
        adapterCreator: guild.voiceAdapterCreator,
        selfMute: false,
        selfDeaf: false,
    }) 
  
    //--YTDL-CORE--
    //const stream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1024 * 1024 * 10 ,liveBuffer: 4000 }) // buffer size 10MB for videos and 4 sec for livestreams
    //const resource = createAudioResource(stream, { inlineVolume: false/*true*/ }) // TODO better solution for volume control
    //resource.volume.setVolume(0.1)
  
    //--PLAY-DL--
    if(url!=''){
      var stream = await play.stream(url)
    }else{
      var stream = await play.stream(ytSearch[0].url)
    }
    
    let resource = createAudioResource(stream.stream, {
        inputType: stream.type
    })
  
    player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Play
        }
    })
    
    player.play(resource)
    connection.subscribe(player)
    next = false

    //pause news/twitter handler while playing audio stream
    clearInterval(news_handler)
    clearInterval(twitter_handler)
    news_handler = 0
    twitter_handler = 0
    
    //error handler, post message, leave channel and reset news/twitter handler interval
    player.on('error', error => {
        console.error(`Error: ${error.message}`)
        setTimeout(() => connection.disconnect(), 10000)
        if(news_handler === 0 && twitter_handler === 0){
            news_handler = setInterval(function(){news.read_rss(client)}, 60000)
            twitter_handler = setInterval(function(){news.read_twitter(client)}, 900000)
        }
    })
    //leave channel once done and reset news/twitter handler interval
    player.on(AudioPlayerStatus.Idle, () => {
        if(next != true){
            setTimeout(() => connection.disconnect(), 10000)
            if(news_handler === 0 && twitter_handler === 0){
                news_handler = setInterval(function(){news.read_rss(client)}, 60000)
                twitter_handler = setInterval(function(){news.read_twitter(client)}, 900000)
            }
        }
    })
  }
  //----------------------

  //catch every not handled exception
process.on('uncaughtException', err => {
    console.error(err && err.stack)
})