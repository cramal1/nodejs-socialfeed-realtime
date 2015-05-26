let App = require('./app/app')
let requireDir = require('require-dir')
let config = requireDir('./config', {recurse: true})

let app = new App(config)
let port = process.env.PORT || 8000

app.initialize(port)
  .then(()=> console.log(`Listening @ http://127.0.0.1:${port}`))
  .catch(e => console.log(e.stack ? e.stack : e))
