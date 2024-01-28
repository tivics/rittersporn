const sqlite3 = require('sqlite3');
var db = new sqlite3.Database(process.env.FAVORITES_PATH);

module.exports = {
    addFavorites: async function (name, url) {
        db.run('INSERT INTO FAVORITES(ID,NAME,URL,COUNT) VALUES((SELECT MAX( ID ) FROM FAVORITES) +1, ?, ? ,?, 1)', [String(name), String(url)], (err) => {
            if(err) {
              return console.log(err.message)
            }
          })
    },
    getFavorites: async function (page) {
      db.all("SELECT ID,NAME,URL,COUNT FROM FAVORITES WHERE COUNT BETWEEN $start AND $end ORDER BY COUNT", {
        $start: ((page * 9) - 8),
        $end: (page * 9),
      },
      (error, rows) => {
        if(error){
          console.log(error)
        }
        else{
          return rows
        }
      })
    }
}