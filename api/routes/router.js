const colors = require('colors');
const post_ctrl = require('../controllers/post_ctrl');
const tag_ctrl = require('../controllers/tag_ctrl');
const user_ctrl = require('../controllers/user_ctrl');
const index_ctrl = require('../controllers/index_ctrl');

function handlePreflight() {
	res.json({});
}

exports.initialize = function(app) {
	app.use((req,res,next)=>{
		console.log(colors.yellow(new Date().toISOString()));
		next();
	});

	app.route('/')
	.get(index_ctrl.show);

	app.route('/api/post/trending')
	.get(post_ctrl.listByTrending)

	app.route('/api/post/time/:condition')
	.get(post_ctrl.listByTime)

	app.route('/api/post/user/:condition')
	.get(post_ctrl.listByUser)

	app.route('/api/post/followers')
	.get(post_ctrl.listByFollowers)

	app.route('/api/post/rate/:post_id')
	.post(post_ctrl.rate)

	app.route('/api/post/:condition')
	.get(post_ctrl.list)

	app.route('/api/post')
	.get(post_ctrl.list)
	.post(post_ctrl.create)
	.delete(post_ctrl.delete)

	app.route('/api/tag/search/:tagname')
	.get(tag_ctrl.search)

	app.route('/api/tag/:tagname')
	.get(tag_ctrl.list)

	app.route('/api/user/bio/:user_id')
	.post(user_ctrl.updateBio)

	app.route('/api/user/follow/:user_id')
	.post(user_ctrl.follow)

	app.route('/api/user/unfollow/:user_id')
	.post(user_ctrl.unfollow)

	app.route('/api/user/:user_id')
	.get(user_ctrl.show)
	.post(user_ctrl.create)

}
