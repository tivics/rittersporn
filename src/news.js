const Parser = require('rss-parser')
var parser = new Parser()
const sqlite3 = require('sqlite3');
var db = new sqlite3.Database('./news.db');
const { TwitterApi } = require('twitter-api-v2');
const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN)


module.exports = {
  read_rss: async function (client) {  
    //games-news channel
    const channel = client.channels.cache.find(channel => channel.id === `967033963149418616`)
    var db_result

    //clear record
    //db.run("DELETE FROM NEWS WHERE ID = 1;")
    //initial record
    //db.run("INSERT INTO NEWS (ID,PUB_DATE,TITLE,PROVIDER) VALUES (1,'1000-01-01T00:00:00.000Z','INIT','GAMESTAR')")
    /*

    CREATE TABLE NEWS(
    ID INT PRIMARY KEY     NOT NULL,
    PUB_DATE       TEXT    NOT NULL,
    TITLE		  TEXT	  NOT NULL,
    PROVIDER		  TEXT	  NOT NULL
    );
    */

    /*
        //DB Update
        //let stmt = db.prepare('UPDATE NEWS SET PUB_DATE = ?, TITLE = ? WHERE PROVIDER = ?;') 
        //let updates = stmt.run(String(last_pubDate), String(last_title), 'GAMESTAR')

        //Ausgabe Check
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

    let feed = await parser.parseURL('https://www.gamestar.de/news/rss/news.rss')

    feed.items.forEach(item => {
          date = new Date(item.pubDate)         

   
          let check = db_result.every(row => {
            return !(row.TITLE === item.title)
          })

          if(check != false){
            //insert db und nachricht in channel posten
            db.run('INSERT INTO NEWS(ID,PUB_DATE,TITLE,PROVIDER) VALUES((SELECT MAX( ID ) FROM NEWS) +1, ?, ? ,?)', [String(date), String(item.title), 'GAMESTAR'], (err) => {
              if(err) {
                return console.log(err.message)
              }
              //... todo console Ausgabe neuer Datensatz
            })
            channel.send(item.title + '\n' + item.contentSnippet + '\n' + item.link)
          }
      })
    }, 
  read_twitter: async function (client) {
  /*
    CREATE TABLE TWEETS(
      ID INT PRIMARY KEY     NOT NULL,
      TWEET_ID       TEXT    NOT NULL,
      USER_ID		  TEXT	  NOT NULL
   );
   */
  //hunt-news channel
    const channel = client.channels.cache.find(channel => channel.id === `961721387754606682`)

    const userID = await twitterClient.v2.userByUsername('HuntShowdown')  
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

    twitterClient.v2.userTimeline(String(userID.data.id), { exclude: 'replies'} ).then ((response) => {
      response.tweets.forEach(tweet => {
        if(tweet.id === response.meta.newest_id && tweet.id != last_tweet){
          //update db und nachricht in channel posten
          let stmt = db.prepare('UPDATE TWEETS SET TWEET_ID = ? WHERE USER_ID = ?;') 
          let updates = stmt.run(String(tweet.id), String(userID.data.id))
          channel.send(tweet.text)
        }
      });
        }).catch ((err) => console.error(err))
    /*
    API Key:          E7gqGsSex9QHM5ZTTUIgsYkEn
    API Key Secret:   O0ioEEFUnQ6hsAPEf82feC6SHnfeTCi35QnbVD5wCjt4f4Ty6D
    Bearer Token:     AAAAAAAAAAAAAAAAAAAAAF02bQEAAAAA9Hi0%2BzpAxkSBHzBx1NygDj2TQg0%3Dvnecn4lOMLBbIT61laCi1SGGWEvROPzjkja4Gs2RABWjSM2xvb
    */
  }
}