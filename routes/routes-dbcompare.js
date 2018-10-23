const router = require('koa-router')(); // router middleware for koa
const dbcompare = require('../models/dbcompare');


router.get("/dbcompare", dbcompare.compareDatabasesStart);


module.exports = router.middleware();
