const { createAudioResource, AudioPlayerStatus } = require('@discordjs/voice')
const ytdl  = require('ytdl-core')
module.exports = {
    play_youtube: async (url, message,connection, player) => {

    
        const stream = await ytdl(url, { filter: 'audioonly', quality: 'lowest' })
        const resource = createAudioResource(stream, { inlineVolume: false/*true*/ }) //todo performante Lösung für Lautstärkeregelung
        //resource.volume.setVolume(0.1);
        player.play(resource)
     
        connection.subscribe(player)    
        setTimeout(() => message.delete(), 10000)
    
        player.on(AudioPlayerStatus.Idle, () => {
            setTimeout(() => connection.disconnect(), 10000)
        });
    },
    play_spotify: (args) => {
        //todo
    }
};
