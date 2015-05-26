let isLoggedIn = require('./middlewares/isLoggedIn')
let Twitter = require('twitter')
let Facebook = require('facebook-node-sdk')
// let google = require('googleapis')
// let plus = google.plus('v1')
// let OAuth2 = google.auth.OAuth2
let nodeify = require('bluebird-nodeify')
// let posts = require('../data/posts')
let then = require('express-then')
let request = require('request')
let nodeifyit = require('nodeifyit')
let Promise = require("bluebird")
Promise.promisifyAll(Facebook)
require('songbird')

module.exports = (app) => {
    let passport = app.passport
    let twitterConfig = app.config.auth.twitterAuth
    let networks = {
        twitter: {
              icon: 'twitter',
              name: 'twitter',
              class: 'btn-primary'
        },
        facebook: {
              icon: 'facebook',
              name: 'facebook',
              class: 'btn-primary'
        },
        google: {
            icon: 'google-plus',
            name: 'Google',
            class: 'btn-danger'
        }
    }

    // function getGPlusPost(activity) {
    //     return {
    //         id: activity.id,
    //         image: activity.actor.image.url,
    //         text: activity.object.content,
    //         name: activity.actor.displayName,
    //         username: activity.actor.displayName,
    //         liked: activity.object.plusoners.totalItems > 0 ? true : false,
    //         network: networks.google
    //     }
    // }

    function getTwitterFeeds(req, res, next){
        nodeify(async ()=> {
            let twitterClient = new Twitter({
                consumer_key: twitterConfig.consumerKey,
                consumer_secret: twitterConfig.consumerSecret,
                access_token_key: req.user.twitter.token,
                access_token_secret: req.user.twitter.tokenSecret
            })

            let tweetPosts = await Post.getPosts(networks.twitter.name, req.user.twitter.username)
            let tweets
            try {
                //console.log(network, id, share)
                if(tweetPosts.length > 0) {
                    [tweets] = await twitterClient.promise.get('statuses/home_timeline', {since_id: tweetPosts[0].id})
                } else {
                    [tweets] = await twitterClient.promise.get('statuses/home_timeline')
                }
            
            } catch (e) {
                console.log(e.stack)
            }        

            console.log('consumerKey: ' + twitterConfig.consumerKey)
            console.log('consumerSecret: ' + twitterConfig.consumerSecret)
            console.log('access_token_key: ' + req.user.twitter.token)
            console.log('access_token_secret: ' + req.user.twitter.tokenSecret)
            let [tweets] = await twitterClient.promise.get('statuses/home_timeline')
            console.log('tweets array: ' + tweets)
            tweets = tweets.map(tweet => {
              return {
                id: tweet.id_str,
                image: tweet.user.profile_image_url,
                text: tweet.text,
                name: tweet.user.name,
                username: '@' + tweet.user.screen_name,
                liked: tweet.favorited,
                network: networks.twitter
              }
            })
            req.tweets = tweets
      }(), next)
    }

    function getFacebookFeeds(req, res, next){
        console.log('inside fb feeds...')
        nodeify(async ()=> {
            console.log('req.user.facebook.token: ' +req.user.facebook.token)
            let url = 'https://graph.facebook.com/v2.2/me/feed?fields=id,from,likes,message&access_token=' + req.user.facebook.token
            await request.promise(url,
                nodeifyit(async (error, response, body) => {
                  if (!error && response.statusCode === 200) {
                    let dataFromServer = JSON.parse(body)
                    let data = dataFromServer.data
                    console.log('Data from FB: ' + JSON.stringify(data))
                    let posts = data.map(post => {
                          let isLiked = post.likes ? true : false
                          return {
                            id: post.id,
                            image: '',
                            text: post.message,
                            name: post.from.name,
                            username: req.user.facebook.email,
                            liked: isLiked,
                            network: networks.facebook
                          }
                       })
                    console.log('Posts: ' + JSON.stringify(posts))
                    req.fbposts = posts
                  } else {
                    console.log('Error: ' + error)
                  }
                  next()
                 }, {spread: true}))
      }(), next)
    }

    // Twitter Timeline
    app.get('/timeline', isLoggedIn, getTwitterFeeds, getFacebookFeeds, then(async (req, res, next) => {
        console.log('req.tweets: ' + req.tweets)
        console.log('req.fbposts: ' + req.fbposts)
        let posts = req.tweets
        posts = req.fbposts.reduce( function(coll, item){
            coll.push( item )
            return coll
            }, posts)
        console.log('posts: ' + posts)
        res.render('timeline.ejs', {
                posts: posts
        })
    }))

    // Post Tweets
    app.get('/compose', isLoggedIn, (req, res) => {
        res.render('compose.ejs', {
            message: req.flash('error')
        })
    })

    // Post Tweets
    app.post('/compose', isLoggedIn, then(async (req, res) => {
        let status = req.body.text
        let twitterClient = new Twitter({
            consumer_key: twitterConfig.consumerKey,
            consumer_secret: twitterConfig.consumerSecret,
            access_token_key: req.user.twitter.token,
            access_token_secret: req.user.twitter.tokenSecret
        })
        if(status.length > 140){
            return req.flash('error', 'Status cannot be more than 140 characters!')
        }

        if(!status){
            return req.flash('error', 'Status cannot be empty!')
        }
        await twitterClient.promise.post('statuses/update', {status})

        let url = 'https://graph.facebook.com/v2.2/me/feed?message=' + status +'&access_token=' + req.user.facebook.token
        console.log('URL: ' + url)
         await request.promise.post(url,
            nodeifyit(async (error, response, body) => {
              if (!error && response.statusCode === 200) {
                let dataFromServer = JSON.parse(body)
                console.log('Data from FB: ' + JSON.stringify(dataFromServer))
              } else {
                console.log('Error: ' + error + '\nresponse: ' + response + '\nbody: ' + body)
              }
             res.redirect('/timeline')
             }, {spread: true}))
    }))

    // Like
    app.post('/like/:network/:id', isLoggedIn, then(async (req, res) => {

        let network = req.params.network
        let id = req.params.id
        if(network === "twitter"){
            let twitterClient = new Twitter({
                consumer_key: twitterConfig.consumerKey,
                consumer_secret: twitterConfig.consumerSecret,
                access_token_key: req.user.twitter.token,
                access_token_secret: req.user.twitter.tokenSecret
            })
            await twitterClient.promise.post('favorites/create', {id})
            res.end()
        } else if(network === "facebook") {
            console.log('Like the post: ' + id)
            let postId = id.split('_')
            let url = 'https://graph.facebook.com/v2.2/' + postId[1] + '/likes?access_token=' + req.user.facebook.token
            console.log('URL: ' + url)
             await request.promise.post(url,
                nodeifyit(async (error, response, body) => {
                  if (!error && response.statusCode === 200) {
                    let dataFromServer = JSON.parse(body)
                    let data = dataFromServer.data
                    console.log('Data from FB: ' + JSON.stringify(data))
                  } else {
                    console.log('Error: ' + error + '\nresponse: ' + response + '\nbody: ' + body)
                  }
                res.end()
                 }, {spread: true}))
        }
    }))

    // Like
    app.post('/unlike/:network/:id', isLoggedIn, then(async (req, res) => {
        let network = req.params.network
        let id = req.params.id
        if(network === "twitter"){
            let twitterClient = new Twitter({
                consumer_key: twitterConfig.consumerKey,
                consumer_secret: twitterConfig.consumerSecret,
                access_token_key: req.user.twitter.token,
                access_token_secret: req.user.twitter.tokenSecret
            })
            await twitterClient.promise.post('favorites/destroy', {id})
            res.end()
        } else if(network === "facebook") {
            console.log('Remove like for the post: ' + id)
            let postId = id.split('_')
            let url = 'https://graph.facebook.com/v2.2/' + postId[1] + '/likes?access_token=' + req.user.facebook.token
            console.log('URL: ' + url)
             await request.promise.del(url,
                nodeifyit(async (error, response, body) => {
                  if (!error && response.statusCode === 200) {
                    let dataFromServer = JSON.parse(body)
                    let data = dataFromServer.data
                    console.log('Data from FB: ' + JSON.stringify(data))
                  } else {
                    console.log('Error: ' + error + '\nresponse: ' + response + '\nbody: ' + body)
                  }
                res.end()
                 }, {spread: true}))
        }
    }))

    // Twitter - Reply
    app.get('/reply/:network/:id', isLoggedIn, then(async (req, res) => {
        let network = req.params.network
        let id = req.params.id
        if(network === 'twitter'){
            let twitterClient = new Twitter({
                consumer_key: twitterConfig.consumerKey,
                consumer_secret: twitterConfig.consumerSecret,
                access_token_key: req.user.twitter.token,
                access_token_secret: req.user.twitter.tokenSecret
            })
            let [tweet] = await twitterClient.promise.get('statuses/show/', {id})
              let post = {
                id: tweet.id_str,
                image: tweet.user.profile_image_url,
                text: tweet.text,
                name: tweet.user.name,
                username: '@' + tweet.user.screen_name,
                liked: tweet.favorited,
                network: networks.twitter
              }
            res.render('reply.ejs', {
                post: post
            })
        } else if (network === 'facebook') {
            let url = 'https://graph.facebook.com/v2.2/' + id + '?access_token=' + req.user.facebook.token
            console.log('URL: ' + url)
            let post
             await request.promise.get(url,
                nodeifyit(async (error, response, body) => {
                  if (!error && response.statusCode === 200) {
                    let dataFromServer = JSON.parse(body)
                    console.log('Data from FB: ' + JSON.stringify(dataFromServer))
                    let isLiked = dataFromServer.likes ? true : false
                    post = {
                        id: dataFromServer.id,
                        image: '',
                        text: dataFromServer.message,
                        name: dataFromServer.from.name,
                        username: req.user.facebook.email,
                        liked: isLiked,
                        network: networks.facebook
                    }
                  } else {
                    console.log('Error: ' + error + '\nresponse: ' + response + '\nbody: ' + body)
                  }
                res.render('reply.ejs', {
                    post: post
                })
                 }, {spread: true}))
        }
    }))
    // Twitter - post reply
    app.post('/reply/:network/:id', isLoggedIn, then(async (req, res) => {
        let network = req.params.network
        let id = req.params.id
        let status = req.body.text
        if(network === 'twitter'){
            console.log(status)
            let twitterClient = new Twitter({
                consumer_key: twitterConfig.consumerKey,
                consumer_secret: twitterConfig.consumerSecret,
                access_token_key: req.user.twitter.token,
                access_token_secret: req.user.twitter.tokenSecret
            })
            if(status.length > 140){
                return req.flash('error', 'Status cannot be more than 140 characters!')
            }

            if(!status){
                return req.flash('error', 'Status cannot be empty!')
            }
            let id = req.params.id
            await twitterClient.promise.post('statuses/update', {status: status, in_reply_to_status_id: id})
            res.redirect('/timeline')
        } else if (network === 'facebook'){
            let url = 'https://graph.facebook.com/v2.2/' + id + '/comments?message=' + status + '&access_token=' + req.user.facebook.token
            console.log('Reply to the post on URL: ' + url)
             await request.promise.post(url,
                nodeifyit(async (error, response, body) => {
                  if (!error && response.statusCode === 200) {
                    let dataFromServer = JSON.parse(body)
                    let data = dataFromServer.data
                    console.log('Data from FB: ' + JSON.stringify(data))
                  } else {
                    console.log('Error: ' + error + '\nresponse: ' + response + '\nbody: ' + body)
                  }
                res.redirect('/timeline')
                 }, {spread: true}))
        }

    }))

    // Twitter - Share
    app.get('/share/:network/:id', isLoggedIn, then(async (req, res) => {
        let network = req.params.network
        let id = req.params.id
        if(network === 'twitter'){
            let twitterClient = new Twitter({
                consumer_key: twitterConfig.consumerKey,
                consumer_secret: twitterConfig.consumerSecret,
                access_token_key: req.user.twitter.token,
                access_token_secret: req.user.twitter.tokenSecret
            })
            let [tweet] = await twitterClient.promise.get('statuses/show/', {id})
              let post = {
                id: tweet.id_str,
                image: tweet.user.profile_image_url,
                text: tweet.text,
                name: tweet.user.name,
                username: '@' + tweet.user.screen_name,
                liked: tweet.favorited,
                network: networks.twitter
              }
            res.render('share.ejs', {
                post: post
            })
        } else if (network === 'facebook') {
            let url = 'https://graph.facebook.com/v2.2/' + id + '?access_token=' + req.user.facebook.token
            console.log('URL: ' + url)
            let post
             await request.promise.get(url,
                nodeifyit(async (error, response, body) => {
                  if (!error && response.statusCode === 200) {
                    let dataFromServer = JSON.parse(body)
                    console.log('Data from FB: ' + JSON.stringify(dataFromServer))
                    let isLiked = dataFromServer.likes ? true : false
                    post = {
                        id: dataFromServer.id,
                        image: '',
                        text: dataFromServer.message,
                        name: dataFromServer.from.name,
                        username: req.user.facebook.email,
                        liked: isLiked,
                        network: networks.facebook
                    }
                  } else {
                    console.log('Error: ' + error + '\nresponse: ' + response + '\nbody: ' + body)
                  }
                res.render('share.ejs', {
                    post: post
                })
                 }, {spread: true}))
        }
    }))

 // Twitter - share
    app.post('/share/:network/:id', isLoggedIn, then(async (req, res) => {
        let network = req.params.network
        let id = req.params.id
        let status = req.body.text
        if(network === 'twitter'){
            let twitterClient = new Twitter({
                consumer_key: twitterConfig.consumerKey,
                consumer_secret: twitterConfig.consumerSecret,
                access_token_key: req.user.twitter.token,
                access_token_secret: req.user.twitter.tokenSecret
            })
            if(status.length > 140){
                return req.flash('error', 'Status cannot be more than 140 characters!')
            }

            // if(!status){
            //     return req.flash('error', 'Status cannot be empty!')
            // }
            let id = req.params.id
            console.log('id: ' + id)
            try{
                await twitterClient.promise.post('statuses/retweet/' + id)
            } catch(error){
                console.log('Error: ' + JSON.stringify(error))
            }
            res.redirect('/timeline')
        } else if (network === 'facebook'){
            let postId = id.split('_')
            let url = 'https://graph.facebook.com/v2.2/me/feed?link=https://www.facebook.com/' + postId[0] + '/posts/' + postId[1] +
                 '&message=' + status + '&access_token=' + req.user.facebook.token
            console.log('Share post URL: ' + url)
             await request.promise.post(url,
                nodeifyit(async (error, response, body) => {
                  if (!error && response.statusCode === 200) {
                    let dataFromServer = JSON.parse(body)
                    let data = dataFromServer.data
                    console.log('Data from FB: ' + JSON.stringify(data))
                  } else {
                    console.log('Error: ' + error + '\nresponse: ' + response + '\nbody: ' + body)
                  }
                res.redirect('/timeline')
                 }, {spread: true}))
        }

    }))

return passport

}
