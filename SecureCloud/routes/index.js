var express        = require('express');
var router         = express.Router();
var passport       = require('passport');
var File           = require('../models/file');
var User           = require('../models/user');
var ultraSecretKey = 'n01c4nKnowThisL#*g$h1t';
var sjcl           = require('../node_modules/sjcl/sjcl.js');


// =====================================
// HOME PAGE (with login links) ========
// =====================================
router.get('/', function(req, res) {
  res.render('index', {
    user : req.user // get the user out of session and pass to template
  });
});
router.get('/index', function(req, res) {
  res.render('index', {
    user : req.user // get the user out of session and pass to template
  });
});


// =====================================
// PROFILE SECTION =====================
// =====================================
// we will want this protected so you have to be logged in to visit
// we will use route middleware to verify this (the isLoggedIn function)
router.get('/profile', isLoggedIn, function(req, res) {
  res.render('profile', {
    user : req.user // get the user out of session and pass to template
  });
});

// =====================================
// LOGOUT ==============================
// =====================================
router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

router.post('/saveKeypair', isLoggedIn, function(req,res) {
  var id = sjcl.decrypt(ultraSecretKey, req.cookies.user);

  User.findOne({ 'google.id' : id }, function(err, user) {
    // if there is an error, stop everything and return that
    // ie an error connecting to the database
    if (err)
      return done(err);
    else if (user != undefined) {
      if(user.google.publicKey == undefined) {
        user.google.publicKey = req.body.pub;
        user.google.privateKey = req.body.priv;
        user.save(function(err) {
          if (err) {
            console.log(err);
            throw err;
          }
        });
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Keypair saved!');
      }
    }
    else {
      res.writeHead(200, {'Content-Type': 'text/plain' });
      res.end('Stop hacking me!');
      console.log('Someone tries to save key repeatedly');
    }
  });
});

router.post('/getPubKey', isLoggedIn, function(req,res) {
  User.findOne({ 'google.email' : req.body.email }, function(err, user) {
    // if there is an error, stop everything and return that
    // ie an error connecting to the database
    console.log(user);
    if (err)
      return done(err);
    else if(user != null && user.google.publicKey != undefined) {
      res.writeHead(200, {'Content-Type': 'text/plain' });
      res.end(user.google.publicKey);
    }
    else {
      res.writeHead(404, {'Content-Type': 'text/plain' });
      res.end('Pub key does not exists!');
    }
  });
});



router.get('/getPrivKey', isLoggedIn, function(req, res) {
  var id = sjcl.decrypt(ultraSecretKey, req.cookies.user);

  User.findOne({ 'google.id' : id }, function(err, user) {
    // if there is an error, stop everything and return that
    // ie an error connecting to the database
    if (err)
      return done(err);
    else if(user.google.privateKey != undefined) {
      res.writeHead(200, {'Content-Type': 'text/plain' });
      res.end(user.google.privateKey);
    }
    else {
      res.writeHead(404, {'Content-Type': 'text/plain' });
      res.end('Priv key does not exists');
    }
  });
});

router.post('/getFileKey', isLoggedIn, function(req, res) {
  var fileId = req.body.fileId;
  var user  = req.cookies.email;

  File.where('google.user', user).where('google.id', fileId).exec(function(err, fileArr) {
    // if there is an error, stop everything and return that
    // ie an error connecting to the database
    if (err)
      return done(err);

    // if the file is found
    if (fileArr.length > 0) {
      res.writeHead(200, {'Content-Type': 'text/plain' });
      res.end(fileArr[0].google.password);
    } else {
      res.writeHead(404, {'Content-Type': 'text/plain' });
      res.end('No such file');
    }
  });
});

router.post('/saveFileKey', isLoggedIn, function(req, res) {
  var password = req.body.password;
  var id = req.body.id;
  var user = req.body.user;


  File.where('google.user', user).where('google.id', id).exec(function(err, fileArr) {

    // if there is an error, stop everything and return that
    // ie an error connecting to the database
    if (err)
      return done(err);

    // if the file is found
    if (fileArr.length > 0) {
      res.writeHead(404, {'Content-Type': 'text/plain' });
      res.end('File already have key assigned');
    } else {
      // if there is no user found with that google id, create them
      var newFile            = new File();

      newFile.google.id = id;
      newFile.google.password = password;
      newFile.google.user = user;

      // save our user to the database
      newFile.save(function(err) {
        if (err){
          console.log(err);
        }
      });
      res.writeHead(200, {'Content-Type': 'text/plain' });
      res.end('File key succesfully saved');
    }

  });
});

router.get('/isRegistered', isLoggedIn, function(req, res) {
  var email = req.cookies.email;
  User.findOne({ 'google.email' : email }, function(err, user) {
    // if there is an error, stop everything and return that
    // ie an error connecting to the database
    if (err) {
      return done(err);
    }
    else if(user.google.publicKey == undefined) {
      res.writeHead(200, {'Content-Type': 'text/plain' });
      res.end('false');
    }
    else {
      res.writeHead(200, {'Content-Type': 'text/plain' });
      res.end('true');
    }
  });
});

// =====================================
// LOGIN ===============================
// =====================================
// show the login form
router.get('/login', function(req, res) {
  // render the page and pass in any flash data if it exists
  res.render('login', { message: req.flash('loginMessage') });
});
// process the login form
router.post('/login', passport.authenticate('local-login', {
  successRedirect : '/profile', // redirect to the secure profile section
  failureRedirect : '/login', // redirect back to the signup page if there is an error
  failureFlash : true // allow flash messages
}));


// =====================================
// GOOGLE Login  =======================
// =====================================
// send to google to do the authentication
// profile gets us their basic information including their name
// email gets their emails
router.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email', 'https://www.googleapis.com/auth/drive'] }));

// the callback after google has authenticated the user
router.get('/auth/google/callback',
    passport.authenticate('google', {
      successRedirect : '/setcookie',
      failureRedirect : '/login'
    }));

router.get('/setcookie', function (req, res) {
  res.cookie('user', sjcl.encrypt(ultraSecretKey, req.user.google.id)); //TODO: replay attack - pridat tam nejaku randomnost
  res.cookie('email', req.user.google.email);
  res.redirect('/drive');
});
//// =====================================
//// GOOGLE Login  =======================
//// =====================================
//// send to google to do the authentication
//router.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));
//
//// the callback after google has authorized the user
//router.get('/connect/google/callback',
//    passport.authorize('google', {
//      successRedirect : '/profile',
//      failureRedirect : '/login'
//    }));

module.exports = router;

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

  // if user is authenticated in the session, carry on
  if (req.isAuthenticated())
    return next();

  // if they aren't redirect them to the home page
  res.redirect('/');
}


