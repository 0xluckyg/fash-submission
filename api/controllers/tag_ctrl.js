const async = require('async');
const colors = require('colors');
const Post = require('../models/post');
const Tag = require('../models/tag');

exports.list = (req, res, next)=> {
	if(!req.params.tagname){
		return res.json({
			success:false,
			message: "Tagname must exist"
		});
	}

	Tag.findOne({name: req.params.tagname})
	.populate('posts')
	.exec((err, tag) => {
		if(err)
			return res.json({
				success:false,
				message: err
			})
		else
			return res.json({
				success:true,
				data:tag.posts
			});
	});

}

exports.search = (req, res, next) => {
	if(req.params.tagname.length < 2){
		return res.json({
      success:false,
      message: 'Provide name with more then two letters'
    });
	}
	console.log("Incoming tag search: "+req.params.tagname);
  (async function searchTag(tagname){
    let result = [];
    try {
      result = await Tag.find({$text: {$search: req.params.tagname}});
    }catch(err){
      console.log(colors.red("ERROR in tag search: "+err));
      return res.json({
        success:false,
        message: err
      });
    }
    return res.json({
      success: true,
      data: result
    });
  })(req.params.tagname);
}