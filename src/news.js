const Parser = require('rss-parser')
var parser = new Parser()
const sqlite3 = require('sqlite3');
var db = new sqlite3.Database('./news.db');

module.exports = {
  read_rss: async function (client) {  
    const channel = client.channels.cache.find(channel => channel.id === `961721436546949140`)
  
    var last_pubDate = new Date('1000-01-01T00:00:00.000Z')
    var last_title
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

    db.all("SELECT ID,PUB_DATE,TITLE,PROVIDER FROM NEWS where PROVIDER=$provider AND ID=$id" , {
        $provider: 'GAMESTAR',
        $id: 1
      },
      (error, rows) => {rows.forEach((row) => {
        last_pubDate = new Date(row.PUB_DATE)
        last_title = row.TITLE
      })
    })

    let feed = await parser.parseURL('https://www.gamestar.de/news/rss/news.rss')

    feed.items.forEach(item => {
      date = new Date(item.pubDate)    
        //funktioniert da RSS TOP -> DOWN aufgebaut ist, ansonsten würde beim init alles gepostet werden
        if(date >= last_pubDate && last_title != item.title){
          last_pubDate = date
          last_title = item.title
          //update db und nachricht in channel posten
          let stmt = db.prepare('UPDATE NEWS SET PUB_DATE = ?, TITLE = ? WHERE PROVIDER = ?;') 
          let updates = stmt.run(String(last_pubDate), String(last_title), 'GAMESTAR')
          channel.send(item.title + '\n' + item.contentSnippet + '\n' + item.link)
          //console.log(item.title + '\n' + item.contentSnippet + '\n' + item.link)
        } 
    })
  } 
}