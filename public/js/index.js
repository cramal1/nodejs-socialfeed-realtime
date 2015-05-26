let $ = require('jquery')
let io = require('socket.io-client')
let socket = io()
socket.on('connect', ()=>console.log('connected'))
socket.on('posts', post => {
	console.log(post)
	let postRow = '<div class="row well"><div class="col-xs-1"><img src="'+post.image+'"/></div>'
	postRow = postRow + '<div class="col-lg-9">'
	postRow = postRow + '<div class="row"><p>'
	postRow = postRow + '<strong>'+post.name+'</strong>'+post.username+'<br>'+post.text+'</p></div>'
	postRow = postRow + '<div class="row _icons">'
	let liked = post.liked ? "fa-thumbs-up" : "fa-thumbs-o-up"
	postRow = postRow + '<i class="fa '+liked+' fa-2x _like" name="like-'+post.network.name.toLowerCase()+':'+post.id+'"></i>'
	postRow = postRow + ' <a href="/reply/'+post.network.name.toLowerCase()+'/'+post.id+'" class="fa fa-reply fa-2x"></a>'
	postRow = postRow + ' <a href="/share/'+post.network.name.toLowerCase()+'/'+post.id+'" class="fa fa-share-square-o fa-2x"></a>'
	postRow = postRow + '</div></div><div class="col-xs-2">'
	postRow = postRow + '<span class="btn '+post.network.class+'"><span class="fa fa-'+post.network.icon+'"></span>'+post.network.name+'</a></div></div>'
	$('#postlist').prepend(postRow)
	attachClickEvent()
})