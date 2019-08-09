const Koa = require("koa");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
require("./schedule/cache");
// const fundebug = require("fundebug-nodejs");

const app = new Koa();
const router = new Router();

app.use(bodyParser());

const test = require("./api/index");
const bundle = require("./api/bundle");
const labels = require("./api/labels");
const user = require("./api/user");

const check = require("./api/check");

router.use("/papi/bundle", bundle.routers);
router.use("/papi/labels", labels.routers);
router.use("/papi/user", user.routers);
router.use("/papi/test", test.routers);

router.use("/capi/check", check.routers);

app.use(router.routes()).use(router.allowedMethods());

app.on("error", (err, ctx) => console.error("server error", err));
const port = process.env.PORT || "18060";
app.listen(port, function() {
    console.log(`服务器运行在http://127.0.0.1:${port}`);
});
