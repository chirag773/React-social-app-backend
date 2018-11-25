const express               = require('express');
const router                = express.Router();
const User                  = require("../../models/User");
const gravatar              = require("gravatar");
const bcrypt                = require("bcryptjs");
const jwt                   = require("jsonwebtoken");
const keys                  = require("../../config/keys");
const passport              = require("passport");
const validateRegisterInput = require("../../validation/register");
const validateLoginInput    = require("../../validation/login");


// route  get api/users/test
// desc   test users route 
// access public

router.get("/test", (req,res) => {
    res.json({
        msg:"from users"
    })
})

// route  get api/users/register
// desc   Register users route 
// access public

router.post("/register",(req,res) => {

    const { errors, isValid } = validateRegisterInput(req.body)

    // check the validation 
    if(!isValid){
        return res.status(400).json(errors)
    }

    User.findOne({ email:req.body.email })
        .then(user => {
            if(user){
                errors.email = "Email already exist"
                return res.status(400).json(errors)
            }else{
                const avatar = gravatar.url(req.body.email,{
                    s : "200",  //Size
                    r : "pg",   // ratings
                    d : "default" // Default
                });
                const newUser = new User({
                    name : req.body.name,
                    email : req.body.email,
                    password : req.body.password,
                    avatar:avatar

                });

                bcrypt.genSalt(10, (err,salt) => {
                    bcrypt.hash(newUser.password, salt, (err,hash) => {
                        if(err){
                            throw err
                        }else{
                            newUser.password = hash;
                            newUser.save()
                                .then(user => res.json(user))
                                .catch(err => console.log(err));
                        }
                    });
                });
            }
        })
});


// route  get api/users/login
// desc   login users route / return jwt token
// access public

router.post("/login", (req,res) => {

    const { errors, isValid } = validateLoginInput(req.body)

    // check the validation 
    if(!isValid){
        return res.status(400).json(errors)
    }

    const email = req.body.email;
    const password = req.body.password;

    User.findOne({email: email})
        .then(user => {
            //check for user
            if(!user){
                errors.email = "Email not found"
                return res.status(400).json(errors)
            }else{
                //check pasword
                bcrypt.compare(password,user.password)
                    .then(isMatched => {
                        if(isMatched){
                            // user matched

                            const payload = { id:user.id, name: user.name, avatar: user.avatar}  // create jwt payload

                            //signin user
                            jwt.sign(
                                payload, 
                                keys.secretOrKey, 
                                { expiresIn : 3600}, 
                                (err, token) => {
                                res.json({
                                    success:true,
                                    token: "Bearer " + token
                                })
                            });
                        }else{
                            errors.password = "password is incorrect"
                            return res.status(400).json(errors)
                        }
                    })
            }
        })
});

// route  get api/users/current
// desc   current users route 
// access private

router.get("/current", passport.authenticate("jwt", { session:false}), (req,res) => {
    res.json({
        id:req.user.id,
        name:req.user.name,
        email:req.user.email
    })
});


// route  get api/users/:user_id
// desc   get users route 
// access public 

router.get("/user/:user_id", (req,res) => {
    User.findById(req.params.user_id, (err, user) => {
        if(err){
            //Handle error
            //send error response
            console.log(err);
        }else{
            res.json(user)
        }
    })
})

// route  get api/users/All
// desc   get all users route 
// access public 

router.get("/users/All",(req,res) => {
    errors = {};
    User.find()
        .then(users => {
            if(!users){
                // errors.noprofile = "There are no profiles";
                return res.status(404).json(errors);
            }
            res.json(users);
        })
        .catch(err => res.status(404).json({profile:"There are no profiles"}));
});


// router.post("/user/:user_id/follow-user", passport.authenticate("jwt", { session:false}),(req,res) => {
//     User.findById(req.params.user_id, (err, user) => {

//         if (err) {
//             console.log(err)
//         } else {
//             User.findById( req.user._id , (err, user) => {
//                 if (err) {
//                     console.log(err)
//                 } else {
//                     user.followers.push(req.user._id)
//                     user.following.push( req.params.user_id);
//                     user.save();
//                     res.json(user);
//                 }
//             })
//         }
//     });
// });


// route  post api/users/user/:user_id/follow-user
// desc   post users route 
// access private 

//working perfectly

    router.post("/user/:user_id/follow-user",  passport.authenticate("jwt", { session:false}), (req,res) => {
        if (req.user.id === req.params.user_id) {
            return res.status(400).json({ alreadyfollow : "You cannot follow yourself"})
        }
        User.findById(req.params.user_id)
            .then(user => {
                if(user.followers.filter(follower => 
                    follower.user.toString() === req.user.id ).length > 0){
                    return res.status(400).json({ alreadyfollow : "You already followed the user"})
                }
                
                user.followers.unshift({user:req.user.id});
                // const followedUser = user._id;
                user.save().then(user => res.json(user))
                User.findOne({ email: req.user.email })
                    .then(user => {
                        user.following.unshift({user:req.params.user_id});
                        user.save()
                    })
                    .catch(err => res.status(404).json({alradyfollow:"you already followed the user"}))
            })
    })


// route  post api/users/user/:user_id/unfollow-user
// desc   post users route 
// access private 

//works perfectly


    router.post("/user/:user_id/unfollow-user",  passport.authenticate("jwt", { session:false}), (req,res) =>{
        User.findById(req.params.user_id)
            .then(user => {
                if(user.followers.filter(follower => 
                    follower.user.toString() === req.user.id ).length === 0 ){
                    return res.status(400).json({ unfollow : "you havent follow yet"})
                }
                 // unfollow the user
                 const removeIndex = user.followers
                 .map(item => item.user.toString())
                 .indexOf(req.user.id);



                 //splice of array
                 user.followers.splice(removeIndex,1);
                 //save
                 user.save().then(user => res.json(user))
                User.findOne({ email: req.user.email })
                    .then(user => {
    
                        // unfollow the user
                        const removeIndex = user.following
                        .map(item => item.user.toString())
                        .indexOf(req.params.user_id);


    
                        //splice of array
                        user.following.splice(removeIndex,1);
                        //save
                        user.save().then(user => res.json(user))
                    })
                    .catch(err => res.status(404).json({usernotfound:"No user found"}))
            })
    });




    ///////////////////////////////////////////////saurabh code//////////////////////////////////////////////////


    // router.post("/user/:user_id/follow-user", passport.authenticate("jwt", { session:false}) ,function(req,res){
    //     User.findById(req.user._id,function(err,primaryUser){
    //       if (err) {
    //         console.log(err);
    //       } else {
                
    //          User.findById(req.params.user_id,function(err,secondaryUser){
               
    //            if (err) {
    //             console.log(err);
    //           } else {
                
                
    //             if (primaryUser.following.some((User) => User.userId.toString() === req.params.user_id.toString())) {
                  
    //               console.log("you are already following ");
                  
    //             } else {
                  
    //              //////////////////
    //               var idealInfo = {
    //                 userId:req.params.user_id,
    //         }
            
    //         primaryUser.following.push(idealInfo);
    //         primaryUser.save();
                
    //             var fanInfo = {
    //                 userId:req.user._id,
    //             }
                
    //             secondaryUser.followers.push(fanInfo);
                
    //             secondaryUser.save();
                    
    //             }
                
            
    //           }
    //          }) 
    //       }
    //     })
    //   })





    //===========================================================================================================

    // router.post("/user/:user_id/follow-user",  passport.authenticate("jwt", { session:false}), (req,res) => {
    //     User.findById(req.user._id)
    //         .then(primaryUser => {
    //             User.findById(req.params.id)
    //                 .then(secondaryUser => {
    //                     if (primaryUser.following.some((User) => User.userId.toString() === req.params.id.toString())) {
            
    //                         console.log("you are already following ");
                            
    //                     } else {
    //                         const idealInfo = {
    //                             userId:req.params.id,
    //                             name:req.params.name
    //                         }
    //                         primaryUser.following.push(idealInfo);
    //                         primaryUser.save();
    
    //                         const fanInfo = {
    //                             iserId:req.user._id,
    //                             name:req.user.name
    //                           }
                              
    //                           secondaryUser.followers.push(fanInfo);
                              
    //                           secondaryUser.save();
                               
    //                     }
    //                 })
    //                 .catch(err => console.log("Error from secondaryUser" + err))
    //         })
    //         .catch(err => console.log("Error from primaryUser" + err))
    // })
    





//=============================================================================================================================

    // router.post("/user/:user_id/follow-user",  passport.authenticate("jwt", { session:false}), (req,res) => {
    //     User.findById(req.params.user_id)
    //         .then(user => {
                
    //             User.findOne({ user:req.user.id})
                
    //                 if(user.followers.filter(follower => follower.userId.toString() === req.user._id).length > 0){
    //                     return res.status(400).json({ alreadyLike : "You already followed the user"})
    //                 }
    //                 user.followers.unshift({ user: req.user.id});
    //                 user.save()
    //                 .then(user => {
    //                     user.following.unshift({ user: req.params.user_id});
    //                     user.save().then(user => res.json(user))
    //                 })
    //                 .catch(err => res.status(404).json({cantFollow:"Can't follow the again"}))
    //         })
    // })




///////////////////////////////////////////////////////stack overflow answer/////////////////////////////////////////

// router.post("/user/:user_id/follow-user",  passport.authenticate("jwt", { session:false}), (req,res) => {
//     User.findById(req.params.user_id, function(err, user) {

//         if(user.followers.filter(follower => follower.user.toString() === req.user._id).length > 0 ){
//             return res.status(400).json({ alreadyLike : "User already like the post"})
//         }

//         user.followers.push(req.user._id);
//         var followedUser = user._id;
//         user.save(function(err){
//             if(err){
                
//                 console.log(err)
//             }
//             else
//             {
//                 // Secondly, find the user account for the logged in user
//                 User.findOne({ email: req.user.email }, function(err, user) {
                    
//                     user.following.push(followedUser);
//                     user.save(function(err){
//                         if(err){
//                             console.log(err)
//                         }
//                         else{
//                             //send success response
//                             user = res.json(user)
//                         }
//                     });
//                 });
//             }
//         });
//     });
// });
// if(user.followers.filter(follower => follower.user.toString() === req.user.id).length > 0 ){
//     return res.status(400).json({ alreadyLike : "User already like the post"})
// }



module.exports = router