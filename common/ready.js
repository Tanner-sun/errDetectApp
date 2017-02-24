/**
 * Created by zhangfeng on 2016/9/7.
 */
var Pool = require('generic-pool').Pool;
var baseConfig = require('../config/base_config');
var redis = require('redis');
var cluster = require('cluster');
var logger = require('log4js').getLogger("ready");
var schedule = require("node-schedule");
var mainPageHtml = require("../busiLogic/mHomePage/mainPage_draw");

var mainPage_schedule = require('../busiLogic/mHomePage/schedule_getCode');

require('events').EventEmitter.prototype._maxListeners = 100; // ??


var redisWritePool = new Pool({
    name: 'redisWritePool',
    create: function (callback) {
        var c = redis.createClient(baseConfig.redisWriterOption);
        // parameter order: err, resource
        callback(null, c);
    },
    destroy: function (client) {
        client.end();
    },
    max: 100,
    // optional. if you set this, make sure to drain() (see step 3)
    min: 10,
    // specifies how long a resource can stay idle in pool before being removed
    idleTimeoutMillis: 30000,
    // if true, logs via console.log - can also be a function
    log: false
});


var redisReaderPool = new Pool({
    name: 'redisReaderPool',
    create: function (callback) {
        var c = redis.createClient(baseConfig.redisReaderOption);
        // parameter order: err, resource
        callback(null, c);
    },
    destroy: function (client) {
        client.end();
    },
    max: 10,
    // optional. if you set this, make sure to drain() (see step 3)
    min: 2,
    // specifies how long a resource can stay idle in pool before being removed
    idleTimeoutMillis: 30000,
    // if true, logs via console.log - can also be a function
    log: false
});

function initSchedule() {
    // 每30分钟执行一次 '*/10 * * * *'
    // 加主线程判断
    console.log(cluster.isMaster);
    if(cluster.isMaster){
        schedule.scheduleJob('*/30 * * * *', function(){
            var stationCode = mainPage_schedule.getStations();
            for(var key in stationCode){
                var adressname = stationCode[key].name;
                var adressCode = stationCode[key].code;
                mainPageHtml.returnHtml(adressname,adressCode,"",redisWritePool);
            }
        });
    }
}


module.exports = {
    redisWritePool: redisWritePool,
    redisReaderPool: redisReaderPool,
    initSchedule:initSchedule
};