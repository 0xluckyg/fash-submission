const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
	user_id:String,
	email:String,
	first:String,
	last:String,
	profile: String,
	profile_large: String,
	bio: String,
	following:[{ type: Schema.Types.ObjectId, ref: 'User'}],
	my_followers:[{ type: Schema.Types.ObjectId, ref: 'User'}],
	posts: [{ type: Schema.Types.ObjectId, ref: 'Post'}],
	rated_posts: [{ type: Schema.Types.ObjectId, ref: 'Post'}]
}, { timestamps: true });

// userSchema.index({_id: 1});

const User = mongoose.model('User', userSchema);
module.exports = User;
