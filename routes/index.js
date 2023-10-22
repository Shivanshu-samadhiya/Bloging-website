var express = require('express');
var router = express.Router();
const userModel = require('./users');
const postModel = require('./posts');
const passport = require('passport');
const fs = require("fs");
const path = require("path");
const multer  = require('multer')
const crypto = require("crypto");
// const { route } = require('../app');
/* GET home page. */
const localStragety = require('passport-local');
const mailer = require('../nodemailer');
passport.use(new localStragety(userModel.authenticate()))

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueSuffix)
  }
})
const upload = multer({ storage: storage })

router.get('/', function (req, res, next) {
  res.render('register');
});



router.get('/forgot', function (req, res, next) {
  res.render('forgot');
});

router.get('/forgot/:userid/:key', async function (req, res, next) {
  let user = await userModel.findById({ _id: req.params.userid })
  if (user.key === req.params.key) {
    res.render("reset", { user })
  }
  else {
    res.send("link expire");
  }
})

router.post('/forgot', async function (req, res, next) {
  var user = await userModel.findOne({ email: req.body.email });
  if (!user) {
    res.send("we've sent a mail, if email exists.");
  }
  else{
    crypto.randomBytes(80, async function(err, buff){
      let key = buff.toString("hex");
      mailer(req.body.email, user._id, key)
      .then(async function(){
        user.expirykey = Date.now() - 24*60*60*1000;
        user.key = key;
        await user.save();
        res.send("mail sent");
      })
    })
  }
});

router.post("/resetpass/:userid", async function (req, res, next) {
  let user = await userModel.findOne({ _id: req.params.userid })
  user.setPassword(req.body.password, async function () {
    user.key = "";
    await user.save();
    req.logIn(user, function () {
      res.redirect("/profile");
    })
  })
})

router.get('/profile', isLoggedIn, function (req, res, next) {
  userModel.findOne({ username: req.session.passport.user })
  .populate("posts")
    .then(function (foundUser) {
      console.log(foundUser);
      res.render("profile", { foundUser: foundUser })
    })
});

router.post('/update', isLoggedIn, function (req, res, next) {
  userModel
  .findOneAndUpdate({username: req.session.passport.user}, {username: req.body.username}, {new: true})
  .then(function(updateduser){
    req.login(updateduser, function(err) {
      if (err) { return next(err); }
      return res.redirect('/profile');
    });
  })
});

router.get('/editAccount', isLoggedIn, function (req, res, next) {
  userModel.findOne({ username: req.session.passport.user })
.then(function(user){
  res.render("edit",{user})
})
});
router.get('/check/:username', function (req, res, next) {
  userModel.findOne({username:req.params.username})
  .then(function(user){
    if(user){
      res.json(true)
    }
    else{
      res.json(false)
    }
  })
});
router.post('/post',isLoggedIn, upload.single("postimage") ,function (req, res, next) {
  userModel.findOne({username: req.session.passport.user})
  .then(function(foundUser){
    postModel.create({
      userid: foundUser._id,
      data: req.body.post,
      postimage:req.file.filename
    })
      .then(function (createdpost) {
        foundUser.posts.push(createdpost._id);
         foundUser.save()
         .then(function(){
          res.redirect("back");
        })
      })
  })
});
// multer code for profile image
router.post('/upload',isLoggedIn, upload.single("image"),function (req, res, next) {
   // upload ho chuki hai data req.file mein hai
     userModel.findOne({ username:req.session.passport.user })
     .then(function(foundUser){
      if (foundUser.image !== 'def.png') {
        fs.unlinkSync(`./public/images/uploads/${foundUser.image}`);
      }
      foundUser.image = req.file.filename;
      foundUser.save()
      .then(function(){
        res.redirect("back");
      })
     });
 });
router.get('/like/:postid', isLoggedIn, function (req, res, next) {
 userModel.findOne({username: req.session.passport.user})
 .then(function(foundUser){
  postModel.findOne({_id:req.params.postid})
  .then(function(post){
    if(post.likes.indexOf(foundUser._id) === -1){
      post.likes.push(foundUser._id);
    }
    else{
      post.likes.splice(post.likes.indexOf(foundUser._id) , 1);
    }
      post.save()
      .then(function(){
        res.redirect("back");
      })
  })
 })
});
router.get('/unlike/:postid', isLoggedIn, function (req, res, next) {
  userModel.findOne({username: req.session.passport.user})
    .then(function(foundUser){
      postModel.findOne({_id:req.params.postid})
      .then(function(postdata){
        console.log(postdata.postimage)
        fs.unlinkSync(`./public/images/uploads/${postdata.postimage}`);
      })
       postModel.deleteOne({_id:req.params.postid})
       .then(function(post){
       foundUser.posts.splice(foundUser.posts.indexOf(req.params.postid),1)
       foundUser.save();
       console.log(post)
       res.redirect("back");
       })
    })
 });

router.get('/feed', isLoggedIn, function (req, res, next) {
  userModel.findOne({username: req.session.passport.user})
  .then(function(user){
    postModel
    .find()
    .populate("userid")
      .then(function (allposts) {
        res.render("feed", { allposts, user });
      });
  })
});

// router.get('/register', function (req, res, next) {
//   res.render('register');
// });
router.get('/login', function (req, res, next) {
  res.render('login');
});

router.post('/register', function (req, res, next) {
  userModel.findOne({ username: req.body.username })
    .then(function (foundUser) {
      if (foundUser) {
        // will run if there is some user
        res.send("username already exists");
      }
      else {
        var newuser = new userModel({
          username: req.body.username,
          age: req.body.age,
          image: req.body.image,
          email: req.body.email,
          Passon: req.body.Passon
        })
        userModel.register(newuser, req.body.password)
          .then(function (u) {
            passport.authenticate('local')(req, res, function () {
              res.redirect('/profile');
            })
          })
          .catch(function (e) {
            res.send(e);
          })
      }
    })

})

router.post('/login', passport.authenticate('local', {
  successRedirect: '/profile',
  failureRedirect: '/login'
}), function (req, res, next) {
        
});

router.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/login')
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  else {
    res.redirect('/login')
  }
}

// router.get('/mail', function (req, res, next) {
//  mailer().then(res =>{
//   console.log("Sent mail ! ",res)
//  });
// });

module.exports = router;
