let path = require('path')
let express = require('express')
let morgan = require('morgan')
let cookieParser = require('cookie-parser')
let bodyParser = require('body-parser')
let session = require('express-session')
let MongoStore = require('connect-mongo')(session)
let mongoose = require('mongoose')
let routes = require('./routes')
let Server = require('http').Server
let io = require('socket.io')
let browserify = require('browserify-middleware')
let passportMiddleware = require('./middlewares/passport')
let timeline = require('./timeline')
let flash = require('connect-flash')

require('songbird')
const NODE_ENV = process.env.NODE_ENV || 'development'

module.exports = class App {
    constructor(config) {
        let app = this.app = express()
        this.server = Server(app)
        this.io = io(this.server)
        this.port = process.env.PORT || 8000
		app.config = {
			auth: config.auth[NODE_ENV],
			database: config.database[NODE_ENV]
		}

		passportMiddleware.configure(config.auth[NODE_ENV])
		app.passport = passportMiddleware.passport
		// connect to the database
		mongoose.connect(config.database[NODE_ENV].url)

		// set up our express middleware
		app.use(morgan('dev')) // log every request to the console
		app.use(cookieParser('ilovethenodejs')) // read cookies (needed for auth)
		app.use(bodyParser.json()) // get information from html forms
		app.use(bodyParser.urlencoded({ extended: true }))

		app.set('views', path.join(__dirname, '../views'))
		app.set('view engine', 'ejs') // set up ejs for templating

		this.sessionMiddleware = session({
			secret: 'ilovethenodejs',
			store: new MongoStore({db: 'social-feeder'}),
			resave: true,
			saveUninitialized: true
		})

		// required for passport
		app.use(this.sessionMiddleware)
		// Setup passport authentication middleware
		app.use(app.passport.initialize())
		// persistent login sessions
		app.use(app.passport.session())
		// Flash messages stored in session
		app.use(flash())


        this.io.use((socket, next) => {
            this.sessionMiddleware(socket.request, socket.request.res, next)
        })

		// configure routes
		routes(this.app, this.io)
		timeline.configure(this.app)
		browserify.settings({transform: ['babelify']})
        app.use('/js/index.js', browserify('./public/js/index.js'))

        this.io.on('connection', socket => {
            console.log('a user connected')
            socket.on('disconnect', () => console.log('user disconnected'))
            timeline.streamPosts(socket).then(console.log).catch(e => console.log(e.stack))
        })
    }

	async initialize(port) {
		await this.server.promise.listen(port)
		// Return this to allow chaining
		return this
	}
}
