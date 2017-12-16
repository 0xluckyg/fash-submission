const async = require('async');
const colors = require('colors');
const User = require('../models/user');
const Post = require('../models/post');
const Tag = require('../models/tag');

const redisWrapper = require('../redis_wrapper');

exports.follow = (req, res, next)=> {
	if(!req.params.user_id || !req.body.to_follow) {
		return res.json({
			success:false,
			message: "User ID and ID to follow are required"
		});
	}
	console.log(`User ${req.params.user_id} to follow ${req.body.to_follow}`);
	async.waterfall([
		// get to follow
		function(callback) {
			User.findOne({user_id:req.body.to_follow}, (err, toFollow) => {
				if(err)
					callback(err);
				else{
					if(!toFollow){
						return res.json({
							success: false,
							message:"Failed to retrieve user to follow"
						});
					}
					callback(null, toFollow);
				}
			});
		}, function(toFollow, callback) {
			// get user
			User.findOne({user_id:req.params.user_id}, (err, user) => {
				if(err)
					callback(err)
				else{
					for(let each of user.following){
						if(each.equals(toFollow._id)){
							return res.json({
								success:false,
								message: "You already follow this user"
							});
						}
					}
					user.following.push(toFollow._id);
					user.markModified('following');
					callback(null, toFollow, user);
				}
			});
		}
	], function(err, toFollow, user) {
			user.save((function(err) {
				if(err) {
					console.log("Error occured while follow"+err);
					return res.json({
						success:false,
						message:err
					});
				}else{
					update_my_follow(toFollow, user);
					return res.json({
						success:true,
						data: toFollow
					});
				}
			}));
	});

	// User.findOne({user_id:req.params.user_id}, function(err, user){
	// 	user.following.push(req.body.to_follow)
	// 	user.markModified('followers');
	// 	user.save((function(err) {
	// 		if(err) {
	// 			console.log("Error occured while follow"+err);
	// 			return res.json({
	// 				success:false,
	// 				message:err
	// 			});
	// 		}else{
	// 			update_my_followers(req.params.user_id, req.body.to_follow);
	// 			return res.json({
	// 				success:true,
	// 				data:"Succefully followed"
	// 			});
	// 		}
	// 	}));
	// });
}

const update_my_follow = (toFollow, user) => {
	toFollow.my_followers.push(user._id);
	toFollow.markModified('my_followers');
	toFollow.save((err) => {
		console.log("Error occured while updating my followers");
		console.log(err);
	});
	// User.findOne({user_id:to_follow}, function(err, user){
	// 	if(err) console.log("Error while update my folloers");
	// 	let index = user.my_followers.indexOf(user_id);
	// 	user.my_followers.splice(index,1);
	// 	user.markModified('my_followers');
	// 	user.save((err) => {
	// 		console.log("Error while update my folloers");
	// 	});
	// });
}

exports.unfollow = (req, res, next)=> {
	if(!req.params.user_id) {
		return res.json({
			success:false,
			message: "User ID is required"
		});
	}

	async.waterfall([
		// get to unfollow
		function(callback) {
			User.findOne({user_id:req.body.to_unfollow}, (err, toUnfollow) => {
				if(err)
					callback(err);
				else{
					if(!toUnfollow){
						return res.json({
							success: false,
							message:"Failed to retrieve user to unfollow"
						});
					}
					callback(null, toUnfollow);
				}
			});
		}, function(toUnfollow, callback) {
			// get user
			User.findOne({user_id:req.params.user_id}, (err, user) => {
				if(err)
					callback(err)
				else{
					for(let each of user.following){
						if(each.equals(toUnfollow._id)){
							const index = user.following.indexOf(toUnfollow._id);
							user.following.splice(index, 1);
							user.markModified('following');
							return callback(null, toUnfollow, user);
						}
					}
					return res.json({
						success:false,
						message: "You already follow this user"
					});
				}
			});
		}
	], function(err, toUnfollow, user) {
			user.save((function(err) {
				if(err) {
					console.log("Error occured while unfollow"+err);
					return res.json({
						success:false,
						message:err
					});
				}else{
					update_my_unfollow(toUnfollow, user);
					return res.json({
						success:true,
						data: toUnfollow
					});
				}
			}));
		}
	)
}

const update_my_unfollow = (toFollow, user) => {
	const index = toFollow.my_followers.indexOf(user._id);
	toFollow.my_followers.splice(index, 1);
	toFollow.markModified('my_followers');
	toFollow.save((err) => {
		console.log("Error occured while updating my followers - unfollow");
		console.log(err);
	});
	// User.findOne({user_id:to_follow}, function(err, user){
	// 	if(err) console.log("Error while update my folloers");
	// 	let index = user.my_followers.indexOf(user_id);
	// 	user.my_followers.splice(index,1);
	// 	user.markModified('my_followers');
	// 	user.save((err) => {
	// 		console.log("Error while update my folloers");
	// 	});
	// });
}

exports.updateBio = (req, res, next) => {
	if(!req.body.bio){
		return res.json({
			success: false,
			message: "Bio content must exist"
		});
	}

	User.update({user_id:req.params.user_id}, {$set: {bio:req.body.bio}}, (err, user)=> {
		if(err){
			return res.json({
				success: false,
				message: err
			})
		}else{
			return res.json({
				success: true,
				data: user
			});
		}
	});
}

exports.create = (req,res,next) => {
	if(!req.params.user_id) {
		return res.json({
			success:false,
			message: "User ID is required"
		});
	}
	User.findOne({user_id:req.params.user_id}, function(err, user){
		if(err)
			return res.json({
				success:false,
				message: err
			});
		if(!user){
			let newUser = new User({
				user_id:req.params.user_id,
				first:req.body.first,
				last:req.body.last,
				email:req.body.email,
				profile:req.body.profile,
				profile_large:req.body.profile_large
			});

			newUser.save()
			.then((result) => {
				redisWrapper.setUserId(req.params.user_id, newUser._id.toString());
				return res.json({
					success:true,
					data:newUser
				});
			})
			.catch((err) => {
				return res.json({
					success:false,
					message: err
				});
			});
		}else{
			redisWrapper.setUserId(req.params.user_id, user._id.toString());
			return res.json({
				success: true,
				data: user
			});
		}
	});

}

exports.show = (req, res, next) => {
	if(!req.params.user_id) {
		return res.json({
			success:false,
			message: "Auth ID is required"
		});
	}
	// remove post populate from user here. might bring down performance quite a bit.
	User.findOne({user_id:req.params.user_id})
	.populate('following')
	.populate('my_followers')
	.exec((err, user) => {
		if(err)
			return res.json({
				success:false,
				message:err
			});
		else
			return res.json({
				success:true,
				data:user
			});
	});

}
