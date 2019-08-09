/**
 * bundle数据管理
 */
const LRU = require("lru-cache");
const Service = require("pub-service");
const JSON5 = require("json5");

const MaxDate = 60000;
//住缓存，缓存1分钟
const cache = new LRU({
    maxAge: 60000,
    updateAgeOnGet: true
});
//备份数据，缓存1天
const cache_bak = new LRU({
    maxAge: 86400000,
    updateAgeOnGet: true
});
//缓存乐观锁
const cache_lock = {};
/**
 * 从服务拿数据
 */
async function searchFromService(opts) {
    const model = {
        wlist: [],
        glist: [],
        list: []
    };
    const cache_key = `${opts.platform},${opts.version}`;
    let list = [];
    try {
        list = await Service.Bundle.findVersionPlatform(opts);
    } catch (error) {
        console.log(error);
    }

    list.forEach(item => {
        let label_data = {};
        if (item.labels) {
            try {
                label_data = JSON5.parse(item.labelData);
            } catch (error) {
                //
            }
        }
        let brand = item.brand.split(",");
        brand = brand.map(item => item.toLowerCase());
        const tmp = {
            sign: item.sign,
            link: item.link,
            bundleCompressUrl: item.bundleCompressUrl,
            labels: label_data,
            perce: item.perce,
            brand,
            client_id: item.client_id.split(","),
            pub_type: item.pub_type
        };
        //白名单
        if (item.pub_type * 1 === 2) {
            model.wlist.push(tmp);
        }
        //灰度
        if (item.pub_type * 1 === 1) {
            model.glist.push(tmp);
        }
        //普通
        if (item.pub_type * 1 === 0) {
            model.list.push(tmp);
        }
    });
    //暂时保留所有查询结果
    // if (model.list.length > 0) model.list.length = 1;
    cache.set(cache_key, model, MaxDate);
    return model;
}
module.exports = {
    /**
     * 定义更新缓存，
     * 超时的缓存直接失效
     */
    update: function(keys) {
        console.log("更新一次", keys);
        const opt_list = keys.split(",");
        if (opt_list.length === 2)
            searchFromService({
                version: opt_list[1],
                platform: opt_list[0]
            });
    },
    /**
     * 搜索数据列表,利用双缓存
     * @param {*} version
     * @param {*} platform
     */
    async search(version, platform) {
        const opts = {
            version: version.replace(/\./g, "") * 1,
            platform
        };
        const cache_key = `${opts.platform}_${opts.version}`;
        if (cache.has(cache_key)) {
            console.log("有缓存");
            return cache.get(cache_key);
        } else if (cache_lock[cache_key] && cache_bak.has(cache_key)) {
            console.log("有缓存备份");
            return cache_bak.get(cache_key);
        } else {
            cache_lock[cache_key] = true;
            const data = await searchFromService(opts);
            cache_bak.set(cache_key, data);
            cache_lock[cache_key] = false;
            console.log("数据库获取");
            return data;
        }
    }
};
