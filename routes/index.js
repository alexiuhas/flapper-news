var express = require('express');
var jwt = require('express-jwt');
var router = express.Router();
var auth = jwt({secret: 'SECRET', userProperty: 'payload'});


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

var mongoose = require('mongoose');
var passport = require('passport');
var Post = require('../models/Posts.js');
var Comment = require('../models/Comments.js');
var User = require('../models/Users.js');

router.post('/register', function(req, res, next){
	if(!req.body.username || !req.body.password) {
		return res.status(400).json({message: 'Please fill out all fields'});
	}
	var user = new User();
	user.username = req.body.username;
	user.setPassword(req.body.password);
	user.save(function(err){
		if(err) { return next(err); }
		return res.json({token: user.generateJWT()});
	});
});

router.post('/login', function(req, res, next){
	if(!req.body.username || req.body.password) {
		return res.status(400).json({message: 'Please fill out all fields'});
	}

	passport.authenticate('local', function(err, user, info){
		if(err) {return next(err); }
		if(user){
			return res.json({token: user.generateJWT()});
		} else {
			return res.status(401).json(info);
		}
	})(req, res, next);
});

router.get('/posts', function(req, res, next){
	Post.find(function(err, posts){
		if(err){return next(err); }
		res.json(posts);
	});
});

router.post('/posts', function(req, res, next){
 	var post = new Post(req.body);

 	post.save(function(err, post){
 		if(err) {return next(err); }
 		res.json(post);
 	});
});

router.param('post', function(req, res, next, id){
	var query = Post.findById(id);

	query.exec(function(err, post){
		if (err) {return next(err);}
		if (!post) {return next(new Error('can\'t find post')); }

/*		post.populate('comments', function(err, post){
			if (err) {return next(err);}
		});*/
		req.post = post;
		return next();
	});
});

router.get('/posts/:post', function(req, res, next) {	
	Post.findById(req.post._id).populate('comments').exec(function (err, post) {
		if (err) {return next(err);}

		res.json(post);
	});
});

router.put('/posts/:post/upvote', function(req, res, next) {
	req.post.upvote(function(err, post){
		if (err) {return next(err); }

		res.json(post);
	});
});

router.post('/posts/:post/comments', function(req, res, next){
	var comment = new Comment(req.body);
	comment.post = req.post;

	comment.save(function(err, comment){
		if(err) {return next(err); }

		req.post.comments.push(comment);
		req.post.save(function(err, post){
			if (err) {return next(err);}

			res.json(comment);
		});
	});
});

router.param('comment', function(req, res, next, id){
	var query = Comment.findById(id);

	query.exec(function(err, comment){
		if (err) {return next(err);}
		if (!comment) {return next(new Error('can\'t find comment')); }

		req.comment = comment;
		return next();
	});
});

router.put('/posts/:post/comments/:comment/upvote', function(req, res, next) {
	req.comment.upvote(function(err, comment){
		if (err) {return next(err); }

		res.json(comment);
	});
});

/*
router.get('/posts/:post/comments', function(req, res, next){
	Comment.find(function(err, comments){
		if(err){return next(err); }
		res.json(comments);
	});
});

router.get('/posts/:post/comments/:comment', function(req, res) {
	res.json(req.comment);
});
*/


module.exports = router;
