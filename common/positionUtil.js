/**
 * Created by zhangfeng on 2016/8/26.
 */
'use strict';
var Q = require('q');
var httpUtil = require('./httpUtil');
var commonUtil = require('./commonUtil');
var log4js = require('log4js');
var logger = log4js.getLogger("positionUtil");
var baiduLbsAk = 'VIqafisYEvp6E0j0j0DeWkny';//百度开放平台密钥

/*默认位置*/
var defaultPosition = {
    "CITY": {
        "NAME": "上海",
        "FROMDESTID": 9,
        "PINYIN": "SHANGHAI",
        "PROVINCENAME":"上海"
    },
    "STATION": {
        "NAME": "上海",
        "CODE": "SH",
        "PINYIN": "shanghai",
        "STATIONID": 1
    }
};

/**
 * 将php接口返回的数据转换成要返回的数据结构
 * */
function phpToLocation(obj) {
    return {
        "CITY": {
            "NAME": obj.city.name,
            "FROMDESTID": obj.city.fromDestId,
            "PINYIN": obj.city.pinyin,
            "PROVINCENAME":obj.city.provinceName
        },
        "STATION": {
            "NAME": obj.station.station_name,
            "CODE": obj.station.station_code,
            "PINYIN": obj.station.pinyin,
            "STATIONID": obj.station.station_id
        }
    }
}
module.exports = {
    /**
     * 1. 从cookie中取H5的位置信息，取到的话则转换数据结构并返回，方法结束；
     * 2. 获取客户端IP，根据IP调用百度接口拿到城市名称；
     * 3. 通过城市名称调用PHP接口，拿到城市和站点信息，拿到了就转换数据结构，并返回；否则默认“上海”；
     * */
    getPositon: function (req, res) {
        var ip = commonUtil.getClientIp(req);
        var cookieOption = {
            maxAge: 60 * 60 * 6,//将失效时间设为6个小时
            domain: req.hostname.includes(".lvmama.com") ? "Domain=.lvmama.com;" : ""//如果是通过域名访问的，则将cookie域设置为“.lvmama.com”
        };

        var stationsReq = {
                url: "http://m.lvmama.com/bullet/index.php?s=/HtmlLocalization/getCityStationInfo",
                method: "get",
                params: {}
            },
            mapReq = {
                url: "http://api.map.baidu.com/location/ip?ak=" + baiduLbsAk + "&ip=" + ip + "&coor=bd09ll",
                // url: "http://api.map.baidu.com/location/ip?ak=" + baiduLbsAk + "&ip=" + commonUtil.getClientIp(req) + "&coor=bd09ll",
                method: "get"
            };
        var appLocationInfo = req.cookies.H5_CITY;//app在cookie中存放的
        // var appLocationInfo = "eyAgIkNJVFkiOiB7Ik5BTUUiOiAi5oms5beeIiwiRlJPTURFU1RJRCI6ICI1NiJ9LCAgIlNUQVRJT04iOiB7Ik5BTUUiOiAi5rGf6IuPIiwiQ09ERSI6ICJKUyIsIlBJTllJTiI6ICJKSUFOR1NVIn0gIH0=";//app在cookie中存放的
        var deferred = Q.defer();
        if (appLocationInfo) {
            var h5L = JSON.parse(commonUtil.decodeBase64(appLocationInfo));
            if (h5L.STATION.STATIONID) {//app不会放此字段，如果有此字段，则代表是我们这边放的
            deferred.resolve(h5L);
            return deferred.promise;
            }
            stationsReq.params.cityName = h5L.CITY.NAME;
            httpUtil.get(stationsReq).then(function (data) {
                var parsedLocation = phpToLocation(data.datas);
                var base64Str = commonUtil.encodeBase64(JSON.stringify(parsedLocation));
                res.set('Set-Cookie', 'H5_CITY=' + base64Str + '; Max-Age=' + cookieOption.maxAge + '; Path=/;' + cookieOption.domain);
                deferred.resolve(parsedLocation);
            }, function () {
                deferred.resolve(defaultPosition);
            })
            return deferred.promise;
        }
        logger.info('准备调用百度IP定位接口，传参IP：' + ip);
        //获取新版站点信息+根据ip地址定位当前城市
        httpUtil.get(mapReq).then(function (cityObj) {
            var content, city,
                code = cityObj.status;
            if (code != null && code === 0) {
                content = cityObj.content;
            } else {
                logger.warn("调用百度接口出错，代码为: " + code);
                deferred.resolve(defaultPosition);
                
            }
            if (content) {
                city = commonUtil.getPathValue(content, 'address_detail.city', '上海');
                stationsReq.params.cityName = city.replace(/[市|省]/g, "");
                httpUtil.get(stationsReq).then(function (data) {
                    var parsedLocation = phpToLocation(data.datas);
                    var base64Str = commonUtil.encodeBase64(JSON.stringify(parsedLocation));
                    res.set('Set-Cookie', 'H5_CITY=' + base64Str + '; Max-Age=' + cookieOption.maxAge + '; Path=/;' + cookieOption.domain);
                    deferred.resolve(parsedLocation);
                }, function () {
                    deferred.resolve(defaultPosition);
                })
            }
        }, function (e) {
            logger.error("getPositon方法异常，返回默认城市，错误信息：" + e.message);
            deferred.resolve(defaultPosition);
        });
        return deferred.promise;
    }
};


