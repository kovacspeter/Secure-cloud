var express = require('express');
var router = express.Router();

/* GET about info. */
router.get('/',function(req, res) {
    res.render('about',{
        user : req.user // get the user out of session and pass to template
    });
});

module.exports = router;
