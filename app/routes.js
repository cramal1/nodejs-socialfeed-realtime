let isLoggedIn = require('./middlewares/isLoggedIn')
module.exports = (app) => {
    let passport = app.passport

    let scope = 'email'

    app.get('/', (req, res) => res.render('index.ejs'))

    app.get('/profile', isLoggedIn, (req, res) => {
        res.render('profile.ejs', {
            user: req.user,
            message: req.flash('error')
        })
    })

    app.get('/logout', (req, res) => {
        req.logout()
        res.redirect('/')
    })

    app.get('/login', (req, res) => {
        res.render('login.ejs', {message: req.flash('error')})
    })

    app.get('/signup', (req, res) => {
        res.render('signup.ejs', {message: req.flash('error') })
    })

    app.post('/login', passport.authenticate('local-signin', {
		successRedirect: '/profile',
		failureRedirect: '/login',
		failureFlash: true
    }))
  // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
		successRedirect: '/profile',
		failureRedirect: '/signup',
		failureFlash: true
    }))

    // Facebook - Authentication route and callback URL
	app.get('/auth/facebook', passport.authenticate('facebook', {scope: 'email, publish_actions, user_posts, user_likes, read_stream'}))

    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successRedirect: '/profile',
        failureRedirect: '/profile',
        failureFlash: true
    }))

    // Authorization route and callback
    app.get('/connect/facebook', passport.authorize('facebook', {scope: ['email, publish_actions, user_posts, user_likes, read_stream']}))
    app.get('/connect/facebook/callback', passport.authorize('facebook', {
        successRedirect: '/profile',
        failureRedirect: '/profile',
        failureFlash: true
    }))

    // Twitter - Authentication route and callback URL
    app.get('/auth/twitter', passport.authenticate('twitter', {scope}))

    app.get('/auth/twitter/callback', passport.authenticate('twitter', {
        successRedirect: '/profile',
        failureRedirect: '/profile',
        failureFlash: true
    }))

    // Authorization route and callback
    app.get('/connect/twitter', passport.authorize('twitter', {scope}))
    app.get('/connect/twitter/callback', passport.authorize('twitter', {
        successRedirect: '/profile',
        failureRedirect: '/profile',
        failureFlash: true
    }))

    // Google - Authentication route and callback URL
    app.get('/auth/google', passport.authenticate('google', {scope: 'https://www.googleapis.com/auth/plus.login email'}))
    app.get('/auth/google/callback', passport.authenticate('google', {
        successRedirect: '/profile',
        failureRedirect: '/profile',
        failureFlash: true
    }))

require('./twitterroutes')(app)

return passport

}
