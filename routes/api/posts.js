const express   = require('express');
const router    = express.Router();
const passport              = require("passport");
const Post      = require("../../models/Post");
const Profile   = require("../../models/Profile");

const validatePostInput = require("../../validation/post");

// route  get api/posts/test
// desc   test posts route 
// access public

router.get("/test", (req,res) => {
    res.json({
        msg:"from posts"
    })
});

// route  get api/posts
// desc   all posts route 
// access public

router.get("/", (req,res) => {
    Post.find()
        .sort({date:-1})
        .then(posts => res.json(posts))
        .catch(err => res.status(404).json({nopost:"no post found"}))
});

// route  get api/posts/post_:id
// desc   single posts route 
// access public

router.get("/:post_id", (req,res) => {
    Post.findById(req.params.post_id)
        .then(post => res.json(post))
        .catch(err => res.status(404).json({nopost:"post has been deleted or wrong id"}))
});
 

// route  post api/posts/
// desc   posts route 
// access private


router.post("/",  passport.authenticate("jwt", { session:false}), (req,res) =>{
    const { errors, isValid } = validatePostInput(req.body)

    // check the validation 
    if(!isValid){
        return res.status(400).json(errors)
    }
    const newPost = new Post({
        text: req.body.text,
        name:req.body.name,
        avatar:req.body.avatar,
        user:req.user.id
    });
    newPost.save().then(posts => res.json(posts))
});


// route  delete api/posts/post_:id
// desc   delete posts route 
// access private


router.delete("/:post_id",  passport.authenticate("jwt", { session:false}), (req,res) =>{
    Profile.findOne({ user:req.user.id})
        .then(profile => {
            Post.findById(req.params.post_id)
                .then(post => {
                    if(post.user.toString() !== req.user.id){
                        return res.status(401).json({noauthorized:"sorry you can't delete this post you are not the creater of the post"})
                    }
                    post.remove().then(()=> res.json({ success: true }))
                })
                .catch(err => res.status(404).json({postnotfound:"No post found"}))
        })
});


// route  post api/posts/like/post_:id
// desc   like posts route 
// access private


router.post("/like/:post_id",  passport.authenticate("jwt", { session:false}), (req,res) =>{
    Profile.findOne({ user:req.user.id})
        .then(profile => {
            Post.findById(req.params.post_id)
                .then(post => {
                    if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0 ){
                        return res.status(400).json({ alreadyLike : "User already like the post"})
                    }

                    //push to array 
                    post.likes.unshift({ user: req.user.id});

                    post.save().then(post => res.json(post))
                })
                .catch(err => res.status(404).json({postnotfound:"No post found"}))
        })
});


// route  post api/posts/unlike/post_:id
// desc   unlike posts route 
// access private


router.post("/unlike/:post_id",  passport.authenticate("jwt", { session:false}), (req,res) =>{
    Profile.findOne({ user:req.user.id})
        .then(profile => {
            Post.findById(req.params.post_id)
                .then(post => {
                    if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0 ){
                        return res.status(400).json({ alreadyLike : "you havent like this post yet"})
                    }

                    // unlike the post
                    const removeIndex = post.likes
                    .map(item => item.user.toString())
                    .indexOf(req.user.id);

                    //splice of array
                    post.likes.splice(removeIndex,1);

                    //save
                    post.save().then(post => res.json(post))
                })
                .catch(err => res.status(404).json({postnotfound:"No post found"}))
        })
});


// route  post api/posts/dislike/post_:id
// desc   like posts route 
// access private


router.post("/dislike/:post_id",  passport.authenticate("jwt", { session:false}), (req,res) =>{
    Profile.findOne({ user:req.user.id})
        .then(profile => {
            Post.findById(req.params.post_id)
                .then(post => {
                    if(post.dislikes.filter(dislike => dislike.user.toString() === req.user.id).length > 0 ){
                        return res.status(400).json({ alreadyLike : "User already dislike the post"})
                    }

                    //push to array 
                    post.dislikes.unshift({ user: req.user.id});

                    post.save().then(post => res.json(post))
                })
                .catch(err => res.status(404).json({postnotfound:"No post found"}))
        })
});


// route  post api/posts/undislike/post_:id
// desc   undislike posts route 
// access private


router.post("/undislike/:post_id",  passport.authenticate("jwt", { session:false}), (req,res) =>{
    Profile.findOne({ user:req.user.id})
        .then(profile => {
            Post.findById(req.params.post_id)
                .then(post => {
                    if(post.dislikes.filter(dislike => dislike.user.toString() === req.user.id).length === 0 ){
                        return res.status(400).json({ alreadyLike : "you havent dislike this post yet"})
                    }

                    // undislike the post index
                    const removeIndex = post.dislikes
                    .map(item => item.user.toString())
                    .indexOf(req.user.id);

                    //splice of array
                    post.dislikes.splice(removeIndex,1);

                    //save
                    post.save().then(post => res.json(post))
                })
                .catch(err => res.status(404).json({postnotfound:"No post found"}))
        })
});


// route  post api/posts/comment/:post_id
// desc   comment on posts route 
// access private

router.post("/comment/:post_id",  passport.authenticate("jwt", { session:false}), (req,res) =>{
    Post.findById(req.params.post_id)
        .then(post => {
            const newComment = {
                text: req.body.text,
                name:req.body.name,
                avatar:req.body.avatar,
                user:req.user.id
            }

            //push to comment array
            post.comments.unshift(newComment); 

            //
            post.save().then(post => res.json(post))
        })
        .catch(err => res.status(404).json({postnotfound:"No post found"}))
})

// route  delete api/posts/comment/:post_id/:comment_id
// desc   comment on posts route 
// access private

router.delete("/comment/:post_id/:comment_id",  passport.authenticate("jwt", { session:false}), (req,res) =>{
    Post.findById(req.params.post_id)
        .then(post => {
            if(post.comments.filter(comment => comment._id.toString() === req.params.comment_id).length === 0 ){
                return res.status(404).json({ commentnotexists:"comment not found "})
            }

            //remove comment index
            const removeIndex = post.comments
                .map(item => item._id.toString())
                .indexOf(req.params.comment_id)
                
                //remove comment 
                post.comments.splice(removeIndex,1)

                post.save().then(post => res.json(post))
        })
        .catch(err => res.status(404).json({postnotfound:"No post found"}))
})

module.exports = router