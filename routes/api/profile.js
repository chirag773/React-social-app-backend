const express   = require('express');
const router    = express.Router();
const passport  = require("passport");
const mongoose  = require("mongoose");
const validateProfileInput    = require("../../validation/profile");
const validateExperienceInput    = require("../../validation/experience");
const validateEducationInput   = require("../../validation/education");

// profile model
const Profile   = require("../../models/Profile");
const User      = require("../../models/User");

router.get("/test", (req,res) => {
    res.json({
        msg:"from profile"
    })
})

// route  get api/profile
// desc   current users profile 
// access private

router.get("/", passport.authenticate("jwt", { session:false}), (req,res) => {
    //errors object
    errors = {};
    Profile.findOne({ user: req.user.id})
        .populate("user",["name","avatar","followers","following"])
        .then(profile => {
            if(!profile){
                errors.noprofile = "There is no profile of this user";
                return res.status(404).json(errors);
            }
            res.json(profile);
        })
        .catch(err => res.status(404).json(err));
});

// route  get api/profile/handle/:handle
// desc   get user profile
// access public


router.get("/handle/:handle", (req,res) => {
    errors = {};
    Profile.findOne({ handle:req.params.handle })
        .populate("user",["name","avatar","followers","following"])
        .then(profile => {
            if(!profile){
                errors.noprofile = "There is no profile of this user";
                return res.status(404).json(errors);
            }
            res.json(profile);
        })
        .catch(err => res.status(404).json({profile:"There is no profile for this user"}));
});




// route  get api/profile/All
// desc   get all user profile 
// access public

router.get("/All",(req,res) => {
    errors = {};
    Profile.find()
        .populate("user",["name","avatar","followers","following"])
        .then(profiles => {
            if(!profiles){
                errors.noprofile = "There are no profiles";
                return res.status(404).json(errors);
            }
            res.json(profiles);
        })
        .catch(err => res.status(404).json({profile:"There are no profiles"}));
});


router.get("/:handle/:id", (req,res) => {
    errors = {};
    Profile.findById( req.params.id )
        .populate("user",["name","avatar","followers","following"])
        .then(profile => {
            if(!profile){
                errors.noprofile = "There is no profile of this user";
                return res.status(404).json(errors);
            }
            res.json(profile);
        })
        .catch(err => res.status(404).json({profile:"There is no profile for this user"}));
});

router.get("/:id", (req,res) => {
    errors = {};
    Profile.findById( req.params.id )
        .populate("user",["name","avatar","followers","following"])
        .then(profile => {
            if(!profile){
                errors.noprofile = "There is no profile of this user";
                return res.status(404).json(errors);
            }
            res.json(profile);
        })
        .catch(err => res.status(404).json({profile:"There is no profile for this user"}));
});



// route  get api/profile/user/:user_id
// desc   get user profile by Id
// access public


router.get("/user/:user_id", (req,res) => {
    errors = {};
    Profile.findOne({ user:req.params.user_id })
        .populate("user",["name","avatar","followers","following"])
        .then(profile => {
            if(!profile){
                errors.noprofile = "There is no profile of this user";
                return res.status(404).json(errors);
            }
            res.json(profile);
        })
        .catch(err => res.status(404).json({profile:"There is no profile for this user"}));
});





// route  Post api/profile     
// desc   create users profile 
// access private

router.post("/", passport.authenticate("jwt", { session:false}), (req,res) => {
    const { errors, isValid } = validateProfileInput(req.body)

    // check the validation 
    if(!isValid){
        return res.status(400).json(errors)
    }
    // take all inputs
    const profileFields =  {};
    profileFields.user = req.user.id;
    if(req.body.handle) profileFields.handle = req.body.handle;   
    if(req.body.company) profileFields.company = req.body.company;  
    if(req.body.website) profileFields.website = req.body.website; 
    if(req.body.location) profileFields.location = req.body.location; 
    if(req.body.status) profileFields.status = req.body.status; 
    if(req.body.bio) profileFields.bio = req.body.bio;
    if(req.body.githubusername) profileFields.githubusername = req.body.githubusername;
    // skills will be split in array
    if(typeof req.body.skills !== "undefined") {
        profileFields.skills = req.body.skills.split(",")
    }

    // social 
    profileFields.social = {};
    if(req.body.youtube) profileFields.social.youtube = req.body.youtube;
    if(req.body.twitter) profileFields.social.twitter = req.body.twitter;
    if(req.body.facebook) profileFields.social.facebook = req.body.facebook;
    if(req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
    if(req.body.instagram) profileFields.social.instagram = req.body.instagram;

    Profile.findOne({ user: req.user.id })
        .then(profile => {
            if (profile) {
                //update
               
                Profile.findOneAndUpdate(
                    { user: req.user.id }, 
                    { $set: profileFields}, 
                    { new: true}
                ).then(profile => console.log(profile))
            } else {
                //create
                       
                //check handel exist 
                Profile.findOne({ handle:profileFields.handle})
                    .then(profile => {
                        
                        //save profile
                        new Profile(profileFields).save()
                            .then(profile => res.json(profile))
                    })
            }
        })
});



// router.put("/:id", passport.authenticate("jwt", { session:false}), function(req, res){
//      const { errors, isValid } = validateProfileInput(req.body)
//      if(!isValid){
//         return res.status(400).json(errors)
//     }
//   Profile.findOne({ user: req.user.id } )
//     .then(profile => {
//         Profile.findOneAndUpdate(
//                      { user: req.user.id }, 
//                      { $set: profileFields}, 
//                      { new: true}
//                  ).then(profile => console.log(profile)
//         )
//     })
// });


// route  Post api/profile/experience     
// desc   create users experience
// access private

router.post("/experience", passport.authenticate("jwt", { session:false}), (req,res) =>{
    const { errors, isValid } = validateExperienceInput(req.body)

    // check the validation 
    if(!isValid){
        return res.status(400).json(errors)
    }
    Profile.findOne({user:req.user.id})
        .then(profile => {
            const newExp = {
                title:req.body.title,
                company:req.body.company,
                location:req.body.location,
                from:req.body.from,
                to:req.body.to,
                current:req.body.current,
                description:req.body.description,
            }

            //add to array at the top
            profile.experience.unshift(newExp);

            profile.save()
                .then(profile => res.json(profile))
        })
});



// route  Post api/profile/education     
// desc   create users education
// access private

router.post("/education", passport.authenticate("jwt", { session:false}), (req,res) =>{
    const { errors, isValid } = validateEducationInput(req.body)

    // check the validation 
    if(!isValid){
        return res.status(400).json(errors)
    }
    Profile.findOne({user:req.user.id})
        .then(profile => {
            const newEdu = {
                school:req.body.school,
                degree:req.body.degree,
                fieldofstudy:req.body.fieldofstudy,
                from:req.body.from,
                to:req.body.to,
                current:req.body.current,
                description:req.body.description,
            }

            //add to array at the top
            profile.education.unshift(newEdu);

            profile.save()
                .then(profile => res.json(profile))
        })
});


// route  DELETE api/profile/experience/:exp_id     
// desc   delete the experience
// access private

router.delete("/experience/:exp_id", passport.authenticate("jwt", { session:false}), (req,res) =>{
   
    Profile.findOne({user:req.user.id})
        .then(profile => {
            //get the remove id
            const removeIndex = profile.experience
                .map(item => item.id)
                .indexOf(req.params.exp_id);

                //splice of array
                profile.experience.splice(removeIndex,1);

                //save
                profile.save().then(profile => res.json(profile))
        })
        .catch(err => res.status(404).json(err));
});


// route  DELETE api/profile/education/:edu_id     
// desc   delete the education
// access private

router.delete("/education/:edu_id", passport.authenticate("jwt", { session:false}), (req,res) =>{
   
    Profile.findOne({user:req.user.id})
        .then(profile => {
            //get the remove id
            const removeIndex = profile.education
                .map(item => item.id)
                .indexOf(req.params.edu_id);

                //splice of array
                profile.education.splice(removeIndex,1);

                //save
                profile.save().then(profile => res.json(profile))
        })
        .catch(err => res.status(404).json(err));
});

// route  DELETE api/profile/    
// desc   delete the education
// access private

router.delete("/", passport.authenticate("jwt", { session:false}), (req,res) =>{
   
    Profile.findOneAndRemove({user:req.user.id})
        .then(() => {
            User.findOneAndRemove({ _id:req.user.id})
                .then(()=> res.json({ success:true}))
        })
        .catch(err => res.status(404).json(err));
});


module.exports = router