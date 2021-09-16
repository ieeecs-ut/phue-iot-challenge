/*
 *  phue bridge gateway service
 *  network internal sector
 */

const utils = require("../utils");

const got = require('got');
const websocket = require('ws');


// main class
const app = {

    // constants
    name: 'phue bridge gateway service (internal)',
    target: '192.168.0.100',
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

// websocket client
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


// web client
const web = {
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

    },
    init: resolve => {
        web.log("initializing");
        if (resolve) resolve();
    },
    // module infra
    log: utils.logger('web'),
    err: utils.logger('web', true),
    exit: resolve => {
        web.log("exit");
        if (resolve) resolve();
    }
};


// entry point
app.link(app.main);