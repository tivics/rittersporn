require("dotenv").config()
const { Client, GatewayIntentBits, Partials } = require('discord.js');

// Keine GUILD_MEMBERS oder andere privilegierte Intents nötig
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,          // Zugriff auf Guilds
        GatewayIntentBits.GuildMessages,   // Zugriff auf Nachrichten in Textchannels
        GatewayIntentBits.MessageContent   // Zugriff auf Message Content (für .send und Lesen)
    ],
    partials: [Partials.Channel]           // Falls Threads oder DM-Channels
});
const { ChannelType } = require('discord.js');
const { startARCEventNotifier  } = require('./events.js');
const apiUrl = 'https://metaforge.app/api/arc-raiders/event-timers'

var news = require('./news.js');
var news_handler
var twitter_handler

//OBSOLETE
/*
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
var favorites = require('./favorites.js')

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

//stop playback
app.get('/stop', async function(req, res){
    player.stop()
    res.send(`stopped`)
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

//favorites
app.get('/getfavorites', async function(req, res) {
    let page = req.query.page
    let matrix = favorites.getFavorites(page)
    res.send(matrix)
  })
*/

//-------DISCORD--------
client.login(process.env.DISCORD_BOT_TOKEN)
//init
client.on('clientReady', async client => {
    //refresh rss feed every minute
    //news_handler = setInterval(function(){news.read_rss(client)}, 60000);
    //start ARCEvent Notifier for channel ARC Events
    // sicherstellen, dass der TextChannel verfügbar ist
    // TextChannel abrufen
    startARCEventNotifier(client, apiUrl);
    //refresh twitter feed every 15 minutes ***UPDATE twitter api needs to be paid since mid of 2023**
    //twitter_handler = setInterval(function(){news.read_twitter(client)}, 900000)
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

//OBSOLETE
/*yt content isn't playable anymore since 07/2025
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
*/
    if (message.content.startsWith('!verteilen')) {
        const sourceChannelId = message.member.voice.channelId;

        const args = message.content.split(' ');
        const maxPerChannel = Number(args[1]) || 2;

        // target channels
        const targetChannels = [
            '786270266014695529',   // Boys Bayou
            '1055476956059156500',  // Battle Boys
            '939212321295847555'    // Rust Belt
        ];

        try {
            await distributeMembers(
                message.guild,
                sourceChannelId,
                targetChannels,
                maxPerChannel
            );           
            //await message.reply('Mitglieder wurden erfolgreich auf die bestehenden Channels verteilt.');
        } catch (err) {
            message.reply(`Fehler: ${err.message}`);
        }
        message.delete()     
    }
    else if(message.content.startsWith('!delete')) {
        await message.channel.messages.fetch({limit: 100}).then(messages => {
            messages.forEach(message =>{
                message.delete()
            })
        })
    }
})

//----------------------
async function distributeMembers(guild, sourceChannelId, targetChannelIds, maxPerChannel) {

    const sourceChannel = guild.channels.cache.get(sourceChannelId);

    if (!sourceChannel || sourceChannel.type !== ChannelType.GuildVoice) {
        throw new Error('Der angegebene Source-Channel ist kein gültiger Voice-Channel.');
    }

    // target channel objects from guild by given IDs
    const targetChannels = targetChannelIds
        .map(id => guild.channels.cache.get(id))
        .filter(ch => ch && ch.type === ChannelType.GuildVoice);

    if (targetChannels.length === 0) {
        throw new Error('Es wurden keine gültigen Ziel-Voice-Channels angegeben.');
    }

    const members = [...sourceChannel.members.values()];
    if (members.length === 0) {
        throw new Error('Es befinden sich keine Mitglieder im Channel.');
    }

    // check how many channels are really needed
    const channelCount = targetChannels.length;
    const fullChannelCount = Math.floor(members.length / maxPerChannel);
    const remainder = members.length % maxPerChannel;

    // array for amount of members per channel
    const distribution = Array(channelCount).fill(0);

    // first fill channels by maxPerChannel 
    for (let i = 0; i < fullChannelCount; i++) {
        distribution[i % channelCount] = maxPerChannel;
    }

    // distribute rest members 
    for (let i = 0; i < remainder; i++) {
        distribution[i % channelCount]++;
    }

    // now assign the members by order in array
    let memberIndex = 0;
    for (let i = 0; i < targetChannels.length; i++) {
        const count = distribution[i];
        for (let j = 0; j < count; j++) {
            if (memberIndex >= members.length) break;
            await members[memberIndex].voice.setChannel(targetChannels[i]);
            memberIndex++;
        }
    }

    return targetChannels;
}
  //catch every not handled exception
process.on('uncaughtException', err => {
    console.error(err && err.stack)
})
//OBSOLETE
/*
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
    //const resource = createAudioResource(stream, { inlineVolume: false }) // TODO better solution for volume control
    //resource.volume.setVolume(0.1)
  
    //--PLAY-DL--
    if(url!=''){
        var stream = await play.stream(url)
        var resource = createAudioResource(stream.stream, {
            inputType: stream.type
        })
    }else if(ytSearch[0].url!=''){
        var stream = await play.stream(ytSearch[0].url)
        var resource = createAudioResource(stream.stream, {
            inputType: stream.type
        })
    }else if(path!=''){
        var resource = createAudioResource(path)
    }
    
  
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
    //clearInterval(twitter_handler)
    news_handler = 0
    //twitter_handler = 0
    
    //error handler, post message, leave channel and reset news/twitter handler interval
    player.on('error', error => {
        console.error(`Error: ${error.message}`)
        setTimeout(() => connection.disconnect(), 10000)
        if(news_handler === 0){// && twitter_handler === 0){
            news_handler = setInterval(function(){news.read_rss(client)}, 60000)
            //twitter_handler = setInterval(function(){news.read_twitter(client)}, 900000)
        }
    })
    //leave channel once done and reset news/twitter handler interval
    player.on(AudioPlayerStatus.Idle, () => {
        if(next != true){
            setTimeout(() => connection.disconnect(), 10000)
            if(news_handler === 0){ //&& twitter_handler === 0){
                news_handler = setInterval(function(){news.read_rss(client)}, 60000)
                //twitter_handler = setInterval(function(){news.read_twitter(client)}, 900000)
            }
        }
    })
  }
  //----------------------
*/