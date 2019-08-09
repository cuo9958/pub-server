/**
 * 更新缓存
 */
// const schedule = require("node-schedule");
const bundle_cache = require("../caches/bundle");
const Service = require("pub-service");

// schedule.scheduleJob("*/10 * * * * *", function() {
//     bundle_cache.update();
// });

const redis = new Service.RedisPub();
redis.subscribe("bpm_publish", function() {
    console.log("监听redis的bpm_publish频道");
});
redis.on("message", function(channel, message) {
    if (channel === "bpm_publish") {
        bundle_cache.update(message);
    }
});
