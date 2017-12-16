const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
	image_url:String,
	owner: {type: Schema.Types.ObjectId, ref: 'User'},
	raters: [{type: Schema.Types.ObjectId, ref: 'User'}],
	rating: Number,
	tags: [{name:String, tag_id: Schema.Types.ObjectId}],
	weight: Number,
	rated_by_me: Boolean,
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
