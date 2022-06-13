const Parser = require('rss-parser')
const sqlite3 = require('sqlite3');
const { TwitterApi } = require('twitter-api-v2');
const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN)

var parser = new Parser()
var db = new sqlite3.Database(process.env.DATABASE_PATH);

module.exports = {
  init: async function(){
    db.run("INSERT INTO NEWS (ID,PUB_DATE,TITLE,PROVIDER) VALUES (1,'1000-01-01T00:00:00.000Z','INIT'," + process.env.PROVIDER_RSS +")")
    let twitter_userID = await twitterClient.v2.userByUsername(process.env.TWITTER_USER)
    db.run("INSERT INTO TWEETS (ID,TWEET_ID,USER_ID) VALUES (1,'0000'," + twitter_userID.data.id + ")")
  },
  read_rss: async function (client) {     
    //gaming-news channel
    const channel = client.channels.cache.find(channel => channel.id === process.env.CHANNEL_RSS)
    var db_result
    //buffer news db
    db.all("SELECT ID,PUB_DATE,TITLE,PROVIDER FROM NEWS where PROVIDER=$provider" , {
      $provider: process.env.PROVIDER_RSS,
    },
    (error, rows) => {
      if(error){
        console.log(error)
      }
      else{
        db_result = rows
      }
    })
    //request and parse RSS feed 
    let feed = await parser.parseURL(process.env.RSS_FEED)
    //loop through results
    feed.items.forEach(item => {
      date = new Date(item.pubDate)         

      let check = db_result.every(row => {
        return !(row.TITLE === item.title)
      })

      if(check != false){
        //new db entry and post message
        db.run('INSERT INTO NEWS(ID,PUB_DATE,TITLE,PROVIDER) VALUES((SELECT MAX( ID ) FROM NEWS) +1, ?, ? ,?)', [String(date), String(item.title), 'GAMESTAR'], (err) => {
          if(err) {
            return console.log(err.message)
          }
        })
        channel.send(item.title + '\n' + item.contentSnippet + '\n' + item.link)
      }
    })
  }, 
  read_twitter: async function (client) {
    //twitter-news channel
    const channel = client.channels.cache.find(channel => channel.id === process.env.CHANNEL_TWITTER)
    const userID = await twitterClient.v2.userByUsername(process.env.TWITTER_USER)  
    var last_tweet
    //loop through db entries and get last tweet id
    db.all("SELECT ID,TWEET_ID,USER_ID FROM TWEETS where USER_ID=$userID AND ID=$id" , {
      $userID: userID.data.id,
      $id: 1
      },
      (error, rows) => {
        if(error){
          console.log(error)
        }
        else{
          rows.forEach((row) => {
            last_tweet = row.TWEET_ID
        })}
      }
    )
    //get tweets from specific user
    twitterClient.v2.userTimeline(String(userID.data.id), { exclude: 'replies' }).then ((response) => {
      response.tweets.forEach(tweet => {      
        if(tweet.id === response.meta.newest_id && tweet.id != last_tweet){
          //update db and post message to channel
          let stmt = db.prepare('UPDATE TWEETS SET TWEET_ID = ? WHERE USER_ID = ?;') 
          stmt.run(String(tweet.id), String(userID.data.id))
          channel.send(tweet.text)
        }
      })
    }).catch ((err) => console.error(err))
  }
}