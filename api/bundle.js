const Router = require("koa-router");
const Service = require("@dal/pub-service");
const JSON5 = require("json5");

const router = new Router();
const redis_pub = new Service.RedisPub();

router.get("/", async function(ctx, next) {
    const {
        limit = 1,
        platform,
        version,
        nickname,
        pub_type,
        status
    } = ctx.query;
    try {
        const opts = {};
        if (platform) opts.platform = platform;
        if (version) opts.version = version.replace(/\./g, "") * 1;
        if (nickname) opts.nickname = nickname;
        if (pub_type) opts.pub_type = pub_type * 1;
        if (status) opts.status = status * 1;
        const data = await Service.Bundle.getCount(limit, opts);
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

router.post("/pub", async function(ctx, next) {
    let {
        version,
        platform,
        sign,
        link,
        bundleCompressUrl,
        pub_type,
        brand = "",
        perce = 100,
        tags = "",
        labels = "",
        remark = ""
    } = ctx.request.body;
    if (!ctx.cookies.get("token")) {
        return (ctx.body = {
            status: 1,
            msg: "请登录"
        });
    }
    const list = await Service.Labels.findByIds(labels.split(","));
    const label_obj = {};
    list.forEach(item => {
        let val = item.attr_val;
        if (item.attr_type === "number") {
            val = val * 1;
        }
        if (item.attr_type === "bool") {
            if (val === "true" || val === "1") {
                val = true;
            } else {
                val = false;
            }
        }
        label_obj[item.attr_name] = val;
    });
    const model = {
        version: version.replace(/\./g, "") * 1,
        platform,
        sign,
        link,
        bundleCompressUrl,
        nickname: "",
        labels,
        labelData: JSON5.stringify(label_obj),
        brand: "",
        perce: 100,
        client_id: "",
        remark,
        pub_type: pub_type * 1,
        status: 0
    };
    //灰度发布
    if (model.pub_type === 1) {
        model.brand = brand;
        model.perce = perce * 1;
    }
    //白名单
    if (model.pub_type === 2) {
        model.client_id = tags;
    }
    model.nickname = decodeURIComponent(ctx.cookies.get("nickname"));
    try {
        await Service.Bundle.insert(model);

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

router.get("/detail/:id", async function(ctx, next) {
    const { id } = ctx.params;
    const data = await Service.Bundle.get(id);
    ctx.body = {
        status: 0,
        data
    };
});
router.post("/del/:id", async function(ctx, next) {
    const { id } = ctx.params;
    const data = await Service.Bundle.del(id);
    ctx.body = {
        status: 0,
        data
    };
});
router.post("/pause/:id", async function(ctx, next) {
    const { id } = ctx.params;
    try {
        await Service.Bundle.unUse(id);
        const data = await Service.Bundle.get(id);
        //发布消息到redis
        redis_pub.publish("bpm_publish", data.platform + "_" + data.version);
    } catch (error) {}
    ctx.body = {
        status: 0,
        data: {}
    };
});
router.post("/publish/:id", async function(ctx, next) {
    const { id } = ctx.params;
    try {
        await Service.Bundle.use(id);
        const data = await Service.Bundle.get(id);
        //发布消息到redis
        redis_pub.publish("bpm_publish", data.platform + "_" + data.version);
    } catch (error) {}
    ctx.body = {
        status: 0,
        data: {}
    };
});
exports.routers = router.routes();
