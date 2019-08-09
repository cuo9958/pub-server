const Router = require("koa-router");
const axios = require("axios");
const config = require("config");
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
    const res = await axios("http://aaa.corp.daling.com/api/checklogin", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        data: encoded({
            username: username,
            password: pwd,
            project: config.get("auth.group"),
            expire: 86400
        })
    });
    if (res.status !== 200) {
        return (ctx.body = {
            status: 1,
            msg: "网络连接失败"
        });
    }
    const data = res.data;
    console.log(data);
    if (data.status == 0) {
        ctx.cookies.set("username", username, {
            expires: new Date(Date.now() + 86400000 * 2)
        });
        ctx.cookies.set("token", data.token, {
            expires: new Date(Date.now() + 86400000 * 2)
        });
        ctx.cookies.set("nickname", encodeURIComponent(data.displayname), {
            expires: new Date(Date.now() + 86400000 * 2)
        });

        ctx.body = {
            status: 0,
            data: {
                username: username,
                nickname: data.displayname,
                token: data.token,
                headimg: data.userphoto
            },
            db: data
        };
    } else {
        ctx.body = {
            status: 1,
            msg: data.message
        };
    }
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
    const res = await axios("http://aaa.corp.daling.com/api/checkauth", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        data: encoded({
            username: username,
            token: token,
            project: config.get("auth.group")
        })
    });
    if (res.status !== 200) {
        return (ctx.body = {
            status: 1,
            msg: "网络连接失败"
        });
    }
    const data = res.data;
    console.log(data);
    if (data.status == 0) {
        ctx.body = {
            status: 0,
            data: {
                nickname: data.displayname,
                headimg: data.userphoto
            }
        };
    } else {
        ctx.body = {
            status: 1,
            msg: data.message
        };
    }
});
exports.routers = router.routes();
