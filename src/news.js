const Parser = require('rss-parser')
const sqlite3 = require('sqlite3');
const { TwitterApi } = require('twitter-api-v2');
const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN)

var parser = new Parser()
var db = new sqlite3.Database('./news.db');

module.exports = {
  read_rss: async function (client) {  
    
    //gaming-news channel
    const channel = client.channels.cache.find(channel => channel.id === process.env.CHANNEL_RSS)
    var db_result

    //clear record
    //db.run("DELETE FROM NEWS WHERE ID = 1;")
    //initial record
    //db.run("INSERT INTO NEWS (ID,PUB_DATE,TITLE,PROVIDER) VALUES (1,'1000-01-01T00:00:00.000Z','INIT','GAMESTAR')")

    /* first draft with only 1 record to keep db size small in future --> caused issue with multiple message at the same time
        //db update
        //let stmt = db.prepare('UPDATE NEWS SET PUB_DATE = ?, TITLE = ? WHERE PROVIDER = ?;') 
        //let updates = stmt.run(String(last_pubDate), String(last_title), 'GAMESTAR')

        //output check
        //console.log(item.title + '\n' + item.contentSnippet + '\n' + item.link)
    */

    db.all("SELECT ID,PUB_DATE,TITLE,PROVIDER FROM NEWS where PROVIDER=$provider" , {
      $provider: 'GAMESTAR',
    },
    (error, rows) => {
      if(error){
        console.log(error)
      }
      else{
        db_result = rows
      }
    }
    )
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
              //... TODO console output new db entry
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
    
    //initial record
    //db.run("INSERT INTO TWEETS (ID,TWEET_ID,USER_ID) VALUES (1,'0000'," + userID.data.id + ")")

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

    twitterClient.v2.userTimeline(String(userID.data.id), { exclude: 'replies' } ).then ((response) => {
      response.tweets.forEach(tweet => {
        if(tweet.id === response.meta.newest_id && tweet.id != last_tweet && tweet.author_id === userID){
          //update db and post message to channel
          let stmt = db.prepare('UPDATE TWEETS SET TWEET_ID = ? WHERE USER_ID = ?;') 
          let updates = stmt.run(String(tweet.id), String(userID.data.id))
          channel.send(tweet.text)
        }
      });
        }).catch ((err) => console.error(err))
  }
}