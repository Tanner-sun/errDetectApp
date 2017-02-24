var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/errUpload', require("../busiLogic/api/errUpload_service").service);

module.exports = router;
