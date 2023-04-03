const sqlite3 = require('sqlite3');
var db = new sqlite3.Database(process.env.FAVORITES_PATH);

module.exports = {
    addFavorites: async function (name, url) {
        db.run('INSERT INTO FAVORITES(ID,NAME,URL,COUNT) VALUES((SELECT MAX( ID ) FROM FAVORITES) +1, ?, ? ,?, 1)', [String(name), String(url)], (err) => {
            if(err) {
              return console.log(err.message)
            }
          })
    }
}