// TODO: define post controlling logics
const async = require('async');
const colors = require('colors');
const Post = require('../models/post');
const Tag = require('../models/tag');
const User = require('../models/user');

const redisWrapper = require('../redis_wrapper');

exports.list = (req, res, next) => {
	//limit and conditions should dynamically change
	let condition = req.params.condition;
	let skip = 0;
	let user_id;
	if(condition){
		condition = condition.split("-");
		skip = parseInt(condition[0]);
		user_id = condition[1];
	}
	console.log("Request in List");
	/*
		Once we have redis and it holds user's mongo id.
		Grab the _id and for each post's rater id, look for match up.
		If there a match, mark the post rated_by_me true
	*/
	let mongoId;
	if(user_id)
		mongoId = redisWrapper.getUserId(user_id);
	Post.find({})
	.populate('owner')
	.skip(skip)
	.limit(10)
	.sort('-createdAt')
	.exec((err, posts) => {
		if(err)
			return res.json({
				success: false,
				message: err
			});
		else{
			if(mongoId){
				posts.forEach((post)=> {
					for(let rater of post.raters){
						if(rater.equals(mongoId)){
							post.rated_by_me = true;
							break;
						}
					}
				});
			}
			return res.json({
				success: true,
				data: posts
			});
		}
	});
}

exports.listByTime = (req, res, next) => {
	// TODO: not scalable when many users post too many
 	let d = req.params.condition;
	console.log("Request in Time");
	Post.find({"createdAt" : { $gte : new ISODate(d) }}, (err, posts) => {
		if(err){
			return res.json({
				success:false,
				message: err
			});
		}
		return res.json({
			success: true,
			data: posts
		})
	});

}

exports.listByTrending = (req, res, next) => {
	//TODO: grab the ones with most raters in given time line?
	/*
		rating: 40,
		raterCount: 30,
		time: 30
	*/
	let timeVar = 24;

	let d = Date.now();

	// TODO: not scalable. have to limit posts for better performance.
	let mostRecent;
	let leastRecent;

	let bestRating;
	let worstRating;

	let mostRated;
	let leastRated;

	let postCount;
	console.log("Request in Trending");

	Post.find({
	    createdAt: {
	        $gte: new Date(d-60*(timeVar*60)*1000).toISOString()
	     }
	 })
	 .populate('owner')
	 .sort("-createdAt")
	 .exec((err, posts) => {
		 if(posts.length === 0){
			 return res.json({
				 success:true,
				 data: []
			 });
		 }

		 let scoreResult = procScore(posts);
		 let countResult = procRatedCount(posts);
		 let timeResult = procTime(posts);

		 mostRecent = timeResult[0];
		 leastRecent = timeResult[1];

		 bestRating = scoreResult[0];
		 worstRating = scoreResult[1];

		 mostRated = countResult[0];
		 leastRated = countResult[1];

		 posts = weightPosts(posts, mostRecent, leastRecent, bestRating, worstRating, mostRated, mostRated, leastRated);

		 posts.sort((a, b) => {
			 return b.weight - a.weight;
		 });

		 return res.json({
			 success: true,
			 data: posts
		 });
	 });
}

const weightPosts = function(posts, mRecent, lRecent, bRating, wRating, mRated, lRated) {
	let postCount = posts.length;
	posts.forEach((post) => {
		let ratingW;
		let timeW;
		let countW;
		ratingW = post.rating ? 40*post.rating/bRating : 0;
		timeW = 30*(new Date(post.createdAt).getTime())/mRecent;
		countW = mRated ? 30*post.raters.length/mRated : 0;
		post.weight = ratingW + timeW + countW;
	});
	return posts;
}

const procTime = function(posts) {
	let m = 0;
	let l = 9007199254740992;

	posts.forEach((post) => {
		let t = new Date(post.createdAt).getTime();
		if(t > m){
			m = t;
		}
		if(t < l){
			l = t;
		}
	});
	return [m,l];
}

const procScore = function(posts) {
	let b = 0;
	let w = 100;
	posts.forEach((post) => {
		if(post.rating > b){
			b = post.rating;
		}
		if(post.rating < w) {
			w = post.rating;
		}
	});
	return [b, w];
}

const procRatedCount = function(posts) {
	let m = 0;
	let l = 9007199254740992;
	posts.forEach((post) => {
		if(post.raters.length > m){
			m = post.raters.length;
		}
		if(post.raters.length < l){
			l = post.raters.length;
		}
	});
	return [m, l];
}

exports.listByUser = (req, res, next) => {
	let condition = req.params.condition;
	let skip = 0;
	let user_id;
	if(condition){
		condition = condition.split("-");
		skip = parseInt(condition[0]);
		user_id = condition[1];
	}
	let mongoId = redisWrapper.getUserId(user_id);
	//TODO: call redis
	User.findOne({user_id:user_id}, function(err, user){
		if(err){
			return res.json({
				success:false,
				message:"Failed to retreive user account"
			});
		}else{
			Post.find({owner:user._id})
			.skip(skip)
			.limit(10)
			.sort('-createdAt')
			.exec((err, posts) => {
				if(err)
					return res.json({
						success: false,
						message: err
					});
				else
					return res.json({
						success: true,
						data: posts
					});
			})
		}
	});
}

exports.listByFollowers = (req, res, next) => {
	// TODO: we can't list every single post by each follower.

	User.findOne({user_id:req.body.params.user_id}, (err, user) => {

	});
}

exports.create = (req, res, next) => {
	if(!req.body.user_id){
		return res.json({
			success:false,
			message:"User ID must exist"
		});
	}

	let newPost = new Post({
		tags: req.body.tags,
		image_url: req.body.image_url
	})

	async.waterfall([
		//find User
		function(callback) {
			User.findOne({user_id:req.body.user_id}, function(err, user){
				if(err) callback(err);
				else callback(null, user);
			});
		},
		// create new post
		function(user, callback) {
			newPost.owner = user._id;
			Post.create(newPost, function(err, post) {
				if(err)
					callback(err)
				else
					callback(null, post, user);
			});
		}, // create associated tags and update user
		function(post, user, callback) {
			//TODO: mark post if rated - rated_by_me
			user.posts.push(post._id);
			user.markModified('posts');
			user.save((err)=> {
				if(err)
					console.log("Error while updating user posts"+err)
			});
			req.body.tags.forEach((tag) => {
				Tag.create({name:tag.name, posts:[post._id]}, function(err, tag){
					if(err){
						console.log(colors.red("Error in creating tag: "+err));
					}
				});
			});
			callback(null, post);
		}
	], function(err, post){
		if(err){
			return res.json({
				success:false,
				message: err
			});
		}else{
			return res.json({
				success: true,
				data: post
			});
		}
	});
}

exports.delete = (req, res, next) => {
	if(!req.body.post_id) {
		return res.json({
			success: false,
			message: "Post ID must exist"
		});
	}

	Post.remove({_id:req.body.post_id}, function(err) {
		if(!err)
			return res.json({
				success:true,
				data: "Successfully removed post "+req.body.post_id
			});
		else
			return res.json({
				success: false,
				message: err
			});
	});

}

exports.rate = (req, res, next) => {
	if(!req.body.rating || !req.params.post_id){
		return res.json({
			success: false,
			message: "Rate score and Post ID must exist"
		});
	}

	User.findOne({user_id:req.body.user_id}, function(err, user){
		if(err || !user)
			return res.json({
				success:false,
				message:"Failed to retrieve such user with the given user_id"
			});
		else{
			Post.findOne({_id:req.params.post_id}, function(err, post) {
				if(err)
					return res.json({
						success:false,
						message: err
					});
				if(!post){
					return res.json({
						success: false,
						message: "Failed to retrieve post with the given post id"
					});
				}
				for(let each of post.raters){
					if(each.equals(user._id)){
						return res.json({
							success:false,
							message:"You already rated this post"
						});
					}
				}
				let current = post.rating || 0;
				let raterCount = post.raters.length;
				let newRating = (current + req.body.rating)/(raterCount+1);
				post.rating = newRating;
				post.raters.push(user._id);
				post.markModified('raters');
				post.markModified('rating');
				post.save()
				.then((result) => {
					console.log("User rated post: "+post._id);
					return res.json({
						success: true,
						data: post
					});
				})
				.catch((err) => {
					return res.json({
						success:false,
						message: err
					})
				});
			});
		}
	});

}
