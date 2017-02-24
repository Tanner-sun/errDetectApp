/**
 * Created by Administrator on 2017/2/14.
 */
/**
 * Created by SunZhenghua on 2016/10/17.
 */

'use strict';
module.exports = {
    appenders: [
        {
            type: "console"
        },
        {
            type: "file",
            level: "ERROR",
            filename: 'logs/log.log',
            maxLogSize: 10*10*1024,
            backups:3,
            category: 'normal'
        }
    ],
    replaceConsole: true
};

