require("dotenv").config()
const {Client} = require("discord.js")

const client = new Client({intents:[]})

client.once("ready",() => {
    console.log(`Ready! Looged in as ${client.user.tag}! I'm on ${client.guilds.cache.size} guild(s)!`)
})
client.login(process.env.DISCORD_BOT_TOKEN)