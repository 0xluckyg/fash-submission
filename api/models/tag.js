const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tagSchema = new Schema({
	name:String,
	posts: [{ type: Schema.Types.ObjectId, ref: 'Post'}],
}, { timestamps: true });

tagSchema.index({name: 'text', description: 'text'});

const Tag = mongoose.model('Tag', tagSchema);
module.exports = Tag;