var express = require('express');
var router = express.Router();

/* GET drive app. */
router.get('/', isLoggedIn, function(req, res) {
  res.render('drive', {
    user : req.user // get the user out of session and pass to template
  });
});

module.exports = router;

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

  // if user is authenticated in the session, carry on
  if (req.isAuthenticated())
    return next();

  // if they aren't redirect them to the login page
  res.redirect('/login');
}