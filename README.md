## Social Feed

This is a aggregated Social Feed app for consumer Facebook, and Twitter in a single Timeline.


Time spent: 35 hrs

### Features

#### Required

- [Done] User can sign in and connect to Facebook and Twitter using `passport`
- [Done] User can view the last 20 posts on their aggregated timeline
- [Done] The current signed in user will be persisted across server restarts
- [Done] In the home timeline, user can view posts with the user profile picture, username, content, origin social network and timestamp.
- [Done] In the timeline, user can like and unlike posts.
- [Done] User can click share in the timeline, and share with a custom message on a separate page.
- [Done] User can click reply in the timeline, and submit a reply on a separate page.
- [Done] User can click compose anywhere, and submit a new post on a separate page.
- [Done] The feed should update in realtime without a page refresh using socket.io
- [Done] Posts should be cached to minimize social network API requests
- [Done] Social network API requests should only load the posts since the lastest cached post

### Optional
[Done] Link google plus account
[Done] Fetch posts from google plus and display it in timeline screen.
- [ ] User can click a post and view it on a separate page with controls to share, like, and reply.
- [ ] User should be able to unshare their posts.
- [ ] User should be able to delete their posts.
- [ ] Replies should be prefixed with the username and link to the conversation thread.
- [ ] User can click a "Next" button at the bottom to load more 

### Walkthrough

![Demo](https://github.com/cramal1/nodejs-socialfeed-demo/blob/master/Social%20feed-Demo_v4.gif)



