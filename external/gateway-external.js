/*
 *  phue bridge gateway service
 *  network external sector
 */

const utils = require("../utils");

const http = require("http");
const websocket = require('ws');
const express = require('express');


// main class
const app = {

    // constants
    name: 'phue bridge gateway service (external)',
    ws_port: 8081,
    http_port: 8080,
    secure: false,

    // main method
    main: _ => {
        console.log(`${app.name.toUpperCase()}`);
        utils.delay(_ => {
            app.log("initializing");
            web.init(_ => {
                ws.init(_ => {
                    app.log('ready');
                });
            });
        }, 50);
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
    initialize_endpoints: resolve => {

        if (resolve) resolve();
    },
    init: resolve => {
        ws.log("initializing");
        ws.initialize_endpoints(resolve);
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
    server: null,
    request_handler: null,
    client: {
        forward_request: (url, method, headers, data) => {
            web.log("forwarding request");
            (async () => {
                try {
                    const response = await got({
                        url: (`${(app.secure ? 'https' : 'http')}://${app.target}${url}`),
                        method: (`${method}`).toUpperCase(),
                        headers: headers,
                        json: data
                    });
                    console.log(response.body);
                } catch (error) {
                    web.err('philips hue connect error', error);
                }
            })();
        },
        handle_response: (res) => {

        }
    },
    // cors: (req, res, next) => {
    //     res.header("Access-Control-Allow-Origin", "*");
    //     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    //     next();
    // },
    // return_error: (res, code, msg) => {
    //     res.status(code);
    //     web.set_type(res, 'application/json');
    //     web.return_json({ status: code, success: false, message: msg });
    // },
    handle_event: (req, res, ep, data) => {
        try {
            data = JSON.parse(data);
        } catch (e) {
            web.err('JSON error', e);
        }
        console.log('');
        web.log('received request')
        console.log('url: \t\t', req.url);
        console.log('endpoint: \t', ep);
        console.log('method: \t', req.method);
        console.log('headers: \n', req.headers);
        console.log('data: \n', data);
        console.log('');

        // TODO: send req to websocket, wait for response, send back response to phue client

        res.end();
    },
    initialize_endpoints: resolve => {
        web.request_handler = (req, res) => {
            let body_data = '';
            req.on('data', chunk => { body_data += chunk; });
            req.on('end', () => {
                web.handle_event(req, res, (`${req.url}`).split('/').slice(1), body_data);
            });
        };
        if (resolve) resolve();
    },
    init: resolve => {
        web.log("initializing");
        web.initialize_endpoints(_ => {
            web.server = http.createServer(web.request_handler);
            web.server.listen(app.http_port);
            web.log("listening on", app.http_port);
            if (resolve) resolve();
        });
    },
    // module infra
    log: utils.logger('web'),
    err: utils.logger('web', true),
    exit: resolve => {
        web.log("exit");
        // web.http.close(_ => {
        if (resolve) resolve();
        // });
    }
};


// entry point
app.link(app.main);