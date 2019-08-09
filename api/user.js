const Router = require("koa-router");
const router = new Router();

const encoded = data => {
    if (typeof data === "string") return encodeURIComponent(data);
    if (typeof data === "object") {
        let params = [];
        for (let k in data) {
            if (!data.hasOwnProperty(k)) return;
            params.push(
                `${encodeURIComponent(k)}=${encodeURIComponent(data[k] || "")}`
            );
        }
        return params.join("&");
    }
    return data;
};

router.post("/login", async function(ctx, next) {
    const username = ctx.request.body.username;
    const pwd = ctx.request.body.pwd;
    if (!username || !pwd) {
        return (ctx.body = {
            status: 1,
            msg: "登录账户或者密码为空"
        });
    }
    if (username != "admin" || pwd != "admin") {
        return (ctx.body = {
            status: 1,
            msg: "账户和密码是admin"
        });
    }
    ctx.cookies.set("username", "guest", {
        expires: new Date(Date.now() + 86400000 * 2)
    });
    ctx.cookies.set("token", "123456abc", {
        expires: new Date(Date.now() + 86400000 * 2)
    });
    ctx.cookies.set("nickname", encodeURIComponent("游客"), {
        expires: new Date(Date.now() + 86400000 * 2)
    });

    ctx.body = {
        status: 0,
        data: {
            username: "guest",
            nickname: "游客",
            token: "123456abc",
            headimg: "http://resource.guofangchao.com/shequ/img_152816850788416.png"
        },
        db: data
    };
});

router.post("/auth", async function(ctx, next) {
    const username = ctx.cookies.get("username");
    const token = ctx.cookies.get("token");
    if (!username || !token) {
        return (ctx.body = {
            status: 1,
            msg: "登录账户或者密码为空"
        });
    }
    if (username != "admin" || pwd != "admin") {
        return (ctx.body = {
            status: 1,
            msg: "账户和密码是admin"
        });
    }
    ctx.body = {
        status: 0,
        data: {}
    };
});
exports.routers = router.routes();
