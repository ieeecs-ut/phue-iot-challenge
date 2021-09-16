/*
 *  phue bridge gateway service
 *  network external sector
 */

const utils = require("./utils");

const http = require("http");
const websocket = require('ws');
const express = require('express');
const body_parse = require('body-parser');

// main class
const app = {
    ws_port: 8081,
    http_port: 8080,
    // main method
    main: _ => {
        console.log('phue bridge gateway service');
        console.log('network external sector');
        console.log('');

        app.log("initializing");
        web.init(_ => {
            ws.init(_ => {
                app.log('ready');
            });
        });
    },
    // module infra
    ws: null, web: null,
    link: resolve => {
        app.ws = ws; app.web = web;
        if (resolve) resolve();
    },
    log: utils.logger('main'),
    err: utils.logger('main', true),
    exit: resolve => {
        app.log("exit");
        app.ws.exit(_ => {
            app.web.exit(_ => {
                if (resolve) resolve();
                process.exit(e);
            });
        });
    }
};

// websocket service
const ws = {
    socket: null,
    initialize: resolve => {

        if (resolve) resolve();
    },
    init: resolve => {
        ws.log("initializing");
        ws.initialize(resolve);
    },
    // module infra
    log: utils.logger('ws'),
    err: utils.logger('ws', true),
    exit: resolve => {
        ws.log("exit");
        ws.socket.close();
        if (resolve) resolve();
    }
};


// web service
const web = {
    express_api: null,
    http_server: null,
    cors: (req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    },
    set_type: (req, res, type) => {
        res.setHeader('content-type', `${type}`);
    },
    return_error: (req, res, code, msg) => {
        res.status(code);
        web.set_type(req, res, 'application/json');
        res.send(JSON.stringify({
            status: code, success: false, message: msg
        }, null, 2));
    },
    init: resolve => {
        web.log("initializing");
        web.express_api = express();
        web.http_server = http.Server(web.express_api);
        web.express_api.use(body_parse.json());
        web.express_api.use(body_parse.urlencoded({ extended: true }));
        web.express_api.use(web.cors);
        // web.express_api.use(express.static("static"));
        web.express_api.get("/", (req, res) => {
            web.set_type(req, res, 'text/plain');
            res.send('hello world');
        });
        web.express_api.listen(app.http_port, _ => {
            web.log("listening on", app.http_port);
            if (resolve) resolve();
        });
    },
    // module infra
    log: utils.logger('web'),
    err: utils.logger('web', true),
    exit: resolve => {
        web.log("exit");
        web.http_server.close(_ => {
            if (resolve) resolve();
        });
    }
};


// entry point
app.link(app.main);