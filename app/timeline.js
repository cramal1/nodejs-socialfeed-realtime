let Twitter = require('twitter')
//let FB = require('fb')
let Post = require('./models/post')
require('songbird')
let twitterConfig
let twitterStreamTracker = {}
let socketTracker = {}

let networks = {
    facebook: {
        icon: 'facebook',
        name: 'Facebook',
        class: 'btn-primary'
    },
    twitter: {
        icon: 'twitter',
        name: 'Twitter',
        class: 'btn-info'
    },
    google: {
        icon: 'google-plus',
        name: 'Google',
        class: 'btn-danger'
    }
}

function getTwitterClient(session) {
    let twitterClient = new Twitter({
        consumer_key: twitterConfig.consumerKey,
        consumer_secret: twitterConfig.consumerSecret,
        access_token_key: session.user.twitter.token,
        access_token_secret: session.user.twitter.tokenSecret
    })
    return twitterClient
}

function createTweetPost(tweet, session) {
    let post = new Post()
    post.id = tweet.id_str
    post.image = tweet.user.profile_image_url
    post.text = tweet.text
    post.name = tweet.user.name
    post.username = "@" + tweet.user.screen_name
    post.liked = tweet.favorited
    post.network = networks.twitter
    post.account = session.user.twitter.username
    post.provider = networks.twitter.name
    post.save()
    return post
}

function configure(app) {
    twitterConfig = app.config.auth.twitterAuth
}

async function streamPosts(socket) {
    let user = socket.request.session.user
    socketTracker[user.twitter.username] = socket
    console.log('socket.request.session.user' + JSON.stringify(socket.request.session.user))
    let tweetPosts = await Post.getPosts(networks.twitter.name, user.twitter.username)
    let twitterClient = getTwitterClient(socket.request.session)
    let tweets
    if(tweetPosts.length > 0) {
        [tweets] = await twitterClient.promise.get('statuses/home_timeline', {since_id: tweetPosts[0].id})
    } else {
        [tweets] = await twitterClient.promise.get('statuses/home_timeline')
    }

    console.log("streamPosts.." + tweets)
    tweets.forEach(tweet => {
        socket.emit('posts', createTweetPost(tweet, socket.request.session))
    })

    if(!twitterStreamTracker[user.twitter.username]) {
        twitterStreamTracker[user.twitter.username] = true
        twitterClient.stream('user', {with: 'followings'}, function(stream){
            stream.on('data', function(tweet) {
                console.log("Incoming straem...." + JSON.stringify(tweet))
                try {
                    if(tweet.text) {
                        console.log('socket.request.session' + socket.request.session)
                        let userSocket = socketTracker[user.twitter.username]
                        let post = createTweetPost(tweet, userSocket.request.session)
                        userSocket.emit('posts', post)
                    }

                } catch (e) {
                    console.log('exception...' + e.stack)
                }
            })

            stream.on('error', function(error) {
                console.log(error)
                twitterStreamTracker[user.twitter.username] = false
            })
        })
    }
}

module.exports = {configure, streamPosts}
