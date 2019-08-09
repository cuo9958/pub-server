const Router = require("koa-router");
const Service = require("@dal/pub-service");

const router = new Router();

router.all("/", function(ctx, next) {
    ctx.body = "不存在的接口";
});

exports.routers = router.routes();
