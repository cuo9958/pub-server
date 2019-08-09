const Router = require("koa-router");
const Service = require("@dal/pub-service");

const router = new Router();

router.get("/", async function(ctx, next) {
    try {
        const data = await Service.Labels.getAll();
        ctx.body = {
            status: 0,
            data: data
        };
    } catch (error) {
        ctx.body = {
            status: 1,
            msg: error.message
        };
    }
});
router.get("/pages", async function(ctx, next) {
    const { limit = 1 } = ctx.query;
    try {
        const data = await Service.Labels.getCount(limit);
        ctx.body = {
            status: 0,
            data: data
        };
    } catch (error) {
        ctx.body = {
            status: 1,
            msg: error.message
        };
    }
});
router.post("/add", async function(ctx, next) {
    const { title, attr_name, attr_val, attr_type = "text" } = ctx.request.body;
    if (!ctx.cookies.get("token")) {
        return (ctx.body = {
            status: 1,
            msg: "请登录"
        });
    }
    const model = {
        title,
        attr_name,
        attr_val,
        nickname: decodeURIComponent(ctx.cookies.get("nickname")),
        attr_type
    };
    console.log(model)
    try {
        const data = await Service.Labels.insert(model);
        ctx.body = {
            status: 0,
            data: data
        };
    } catch (error) {
        ctx.body = {
            status: 1,
            msg: error.message
        };
    }
});
router.post("/change/:id", async function(ctx, next) {
    const { status } = ctx.request.body;
    if (!ctx.cookies.get("token")) {
        return (ctx.body = {
            status: 1,
            msg: "请登录"
        });
    }
    const id = ctx.params.id;
    try {
        console.log(status);
        if (status == 1) {
            await Service.Labels.use(id);
        } else {
            await Service.Labels.del(id);
        }
        ctx.body = {
            status: 0
        };
    } catch (error) {
        ctx.body = {
            status: 1,
            msg: error.message
        };
    }
});
exports.routers = router.routes();
