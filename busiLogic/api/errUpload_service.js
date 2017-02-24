/**
 * Created by Administrator on 2017/2/13.
 */
/**
 * Created by sunguang on 2016/10/18.
 */
'use strict';
const httpUtil = require("../../common/httpUtil");
const commonUtil = require('../../common/commonUtil');
const log4js = require('log4js');
const logger = log4js.getLogger("normal");
const MongoClient = require('mongodb').MongoClient;
const DB_CONN_STR = 'mongodb://localhost:27017/test'

var insertData = (db, _data, callback) => {
    //连接到表
    var collection = db.collection('users');
    //插入数据
    collection.insert(_data, (err, result) => {
        if(err)
        {
            console.log('Error:'+ err);
            return;
        }
        callback(result);
    });
}

var dataPrehandle = (data) => {
    if (/pages/.test(data)) {
        let _data = [{"_errType":'page',"_page":'','_errMsg':''}];
        _data[0]._page = (/pages\/(\w*)\/\w*/.exec(data))[1];
        _data[0]._errMsg = data.replace(/normal\s*\-\s*/,'');
        return _data;
    } else {
        let _data = [{"_errType":'fn',"_fn":'','_errMsg':''}];
        _data[0]._fn = (/-\s+(\w*)/.exec(data))[1];
        _data[0]._errMsg = data.replace(/normal\s*\-\s*/,'');
        return _data;
    }
}

exports.service = (req, res) => {
    res.send('hello world')
    let errMsg = decodeURIComponent(req.query.key);
    let _data = dataPrehandle(errMsg)

    MongoClient.connect(DB_CONN_STR, (err, db) => {
        console.log("连接成功！");
        insertData(db, _data, (result) => {
            console.log(result);
            db.close();
        });
    });

    console.log(errMsg);
};