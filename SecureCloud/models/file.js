// app/models/user.js
// load the things we need
var mongoose = require('mongoose');

// define the schema for our file model
var fileSchema = mongoose.Schema({

    google           : {
        user         : String,
        id           : String,
        password     : String
    }

});

// create the model for users and expose it to our app
module.exports = mongoose.model('File', fileSchema);
