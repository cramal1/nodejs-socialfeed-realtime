let mongoose = require('mongoose')
require('songbird')

let Post
let postSchema = mongoose.Schema({
	id: {
		type: String,
		required: true
	},
	image: {
		type: String,
		required: false
	},
	text: {
		type: String,
		required: false
	},
	name: {
		type: String,
		required: true
	},
	username: {
		type: String,
		required: true
	},
	liked: {
		type: Boolean,
		required: true
	},
	network: {
		type: Object,
		required: true
	},
	account: {
		type: String,
		required: true
	},
	provider: {
		type: String,
		required: true
	}

})

postSchema.statics.getPosts = async function(provider, account) {
	let promise = Post.find({provider: provider, account: account}).sort('-id').exec()
	return await promise
}

module.exports = Post = mongoose.model('Post', postSchema)
