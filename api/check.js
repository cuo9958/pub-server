const Router = require("koa-router");
const bundle_cache = require("../caches/bundle");

const router = new Router();
const azMap = new Map();
azMap.set("0", 0);
azMap.set("1", 1);
azMap.set("2", 2);
azMap.set("3", 3);
azMap.set("4", 4);
azMap.set("5", 5);
azMap.set("6", 6);
azMap.set("7", 7);
azMap.set("8", 8);
azMap.set("9", 9);
azMap.set("a", 1);
azMap.set("b", 2);
azMap.set("c", 3);
azMap.set("d", 4);
azMap.set("e", 5);
azMap.set("f", 6);
azMap.set("g", 7);
azMap.set("h", 8);
azMap.set("i", 9);
azMap.set("j", 0);
azMap.set("k", 1);
azMap.set("l", 2);
azMap.set("m", 3);
azMap.set("n", 4);
azMap.set("o", 5);
azMap.set("p", 6);
azMap.set("q", 7);
azMap.set("r", 8);
azMap.set("s", 9);
azMap.set("t", 0);
azMap.set("u", 1);
azMap.set("v", 2);
azMap.set("w", 3);
azMap.set("x", 4);
azMap.set("y", 5);
azMap.set("z", 6);

/**
 * 检查百分比
 * 1.100直接返回内容
 * 2.不是数字，不返回内容
 * 3.字母转成数字
 */
function checkPrece(model, clientid, platform) {
    const perce = model.perce;
    if (perce === 100) return model;
    if (!clientid) return model;
    let checkStr = clientid.substr(clientid.length - 2).toLowerCase();
    if (checkStr.length < 2) return model;
    try {
        if (platform === "ios" || /[a-z]/.test(checkStr)) {
            const va = azMap.get(checkStr[0]);
            const vb = azMap.get(checkStr[1]);
            checkStr = va + vb + "";
            if (checkStr.length > 2)
                checkStr = clientid.substr(clientid.length - 2);
        }
        checkStr = checkStr * 1;
        console.log(checkStr, clientid);
        if (isNaN(checkStr)) return null;
        if (perce < checkStr) return null;
    } catch (error) {
        console.log(error);
    }

    return model;
}
/**
 * 1.定时缓存数据库的版本+平台信息
 * 2.来源请求去查询是否有合适的数组
 * 3.先差白名单，再查灰度，最后再查普通的，N+N+1
 * 4.返回数据+自定义字段
 */
router.all("/", async function(ctx, next) {
    const { version, platform, clientid } = ctx.header;
    if (!version || !platform) {
        ctx.body = {
            status: 1,
            errmsg: "不是正常的客户端请求"
        };
        return;
    }
    const timeStart = Date.now();
    let brand = ctx.header.brand;
    //兼容postman的请求header
    if (typeof brand === "string" && brand.includes(",")) {
        const tmp = brand.split(",");
        brand = tmp[tmp.length - 1];
    }
    if (typeof brand === "string") brand = brand.toLowerCase();
    if (!version) version = "";
    const list = await bundle_cache.search(version, platform);
    let active = list.wlist.filter(item => item.client_id.includes(clientid));
    if (!active || active.length === 0) {
        console.log("灰度请求", brand);
        if (platform === "ios") active = list.glist;
        if (platform === "android")
            active = list.glist.filter(item => item.brand.includes(brand));
        if (active.length > 0)
            active = checkPrece(active[0], clientid, platform);
        //兼容没有品牌的灰度情况
        if (active.length === 0) {
            active = list.glist.filter(item => item.brand.length === 0);
            if (active.length > 0)
                active = checkPrece(active[0], clientid, platform);
        }
    }
    if (!active || active.length === 0) {
        console.log("普通请求");
        active = list.list[0];
    }
    // console.log(list.list);
    if (!active) {
        ctx.body = {
            status: 1,
            errmsg: "没有可用的版本"
        };
        return;
    }
    if (active.length > 0) active = active[0];
    console.log(active);
    if (!active.labels) active.labels = {};
    const data = Object.assign(active.labels, {
        sign: active.sign,
        downloadUrl: active.link,
        bundleCompressUrl: active.bundleCompressUrl
    });
    ctx.body = {
        status: 0,
        data,
        timeline: Date.now() - timeStart
    };
});

//是否需要升级
router.all("/update", async function(ctx, next) {
    ctx.body = {
        status: 0
    };
});
exports.routers = router.routes();
