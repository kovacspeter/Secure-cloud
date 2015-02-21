// config/passport.js

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

// load up the user model
var User            = require('../models/user');

// load the auth variables
//var configAuth = require('./auth');
var configAuth = {
    'googleAuth' : {
        'clientID'      : '1079273904456-fnhtnp9jsenjlanmoo679c09u0edq34r.apps.googleusercontent.com',
        'clientSecret'  : 'euxH2OhSRJlacLtu_oRAbFwZ',
        'callbackURL'   : 'http://localhost:9117/auth/google/callback'
    }
}

// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });
    //=========================================================================
    //GOOGLE ==================================================================
    //=========================================================================
    passport.use(new GoogleStrategy({

            clientID        : configAuth.googleAuth.clientID,
            clientSecret    : configAuth.googleAuth.clientSecret,
            callbackURL     : configAuth.googleAuth.callbackURL,
            // allows us to pass in the req from our route (lets us check if a user is logged in or not)
            passReqToCallback : true
        },
        function(req, token, refreshToken, profile, done) {

            // make the code asynchronous
            // User.findOne won't fire until we have all our data back from Google
            process.nextTick(function() {

                // check if the user is already logged in
                if (!req.user) {

                    // find the user in the database based on their google id
                    User.findOne({ 'google.id' : profile.id }, function(err, user) {

                        // if there is an error, stop everything and return that
                        // ie an error connecting to the database
                        if (err)
                            return done(err);

                        // if the user is found, then log them in
                        if (user) {
                            return done(null, user); // user found, return that user
                        } else {
                            // if there is no user found with that google id, create them
                            var newUser            = new User();

                            // set all of the google information in our user model
                            newUser.google.id    = profile.id;
                            newUser.google.token = token;
                            newUser.google.name  = profile.displayName;
                            newUser.google.email = profile.emails[0].value; // pull the first email

                            // save our user to the database
                            newUser.save(function(err) {
                                if (err)
                                    throw err;

                                // if successful, return the new user
                                return done(null, newUser);
                            });
                        }

                    });

                }
            });
        }));
};

