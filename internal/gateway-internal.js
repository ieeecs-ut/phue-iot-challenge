/*
 *  phue bridge gateway service
 *  network internal sector
 */

const utils = require('../utils');

const fs = require('fs');
const got = require('got');
const websocket = require('ws');

// environment
const args = process.argv.slice(2);
const env = args[0] == 'prod' ? 'prod' : 'dev';
const config = JSON.parse(fs.readFileSync('../config.json', { encoding: 'utf8', flag: 'r' }));

// main class
const app = {

    // constants
    name: "phue bridge gateway service (internal)",
    gateway_url: config.gateway_url,
    bridge_ip: config.bridge_ip,
    secure: false,

    // main method
    main: _ => {
        console.log(`${app.name.toUpperCase()}`);
        utils.delay(_ => {
            app.log("initializing");
            web.init(_ => {
                ws.init(_ => {
                    app.log("ready");
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
    url: null,
    socket: null,
    online: false,
    reconnect_interval: config.ws_reconnect_interval,
    encode_msg: (e, d) => {  // encode event+data to JSON
        return JSON.stringify({
            event: e,
            data: d
        });
    },
    decode_msg: (m) => {  // decode event+data from JSON
        try {
            m = JSON.parse(m);
        } catch (e) {
            ws.log("invalid json msg", e);
            m = null;
        }
        return m;
    },
    send: (event, data, silent = false) => {
        if (!silent) ws.log("sending:", event, data);
        ws.socket.send(ws.encode_msg(event, data));
    },
    connect: resolve => {
        ws.initialize_client(_ => {
            utils.delay(ws.api.login, 500);
            if (resolve) resolve();
        });
    },
    reconnect: _ => {
        ws.log(`reconnecting in ${ws.reconnect_interval / 1000} sec`);
        setTimeout(ws.connect, ws.reconnect_interval);
    },
    handle: (event, data) => {
        switch (event) {
            case 'identity':
                if (data.success === true) {
                    ws.log("identified with gateway server");
                } else {
                    ws.err("failed to identify with gateway server");
                }
                break;
            default:
                ws.log(`unknown event ${event}`);
                break;
        }
    },
    api: {
        login: _ => {
            ws.send('identity', { key: config.key });
        }
    },
    initialize_client: resolve => {
        ws.url = `ws${app.secure ? 's' : ''}://${app.gateway_url}`;
        ws.socket = new websocket(ws.url);
        ws.socket.addEventListener('open', e => {
            ws.log("socket connected");
            ws.online = true;
            if (resolve) resolve();
        });
        ws.socket.addEventListener('error', e => {
            ws.log("socket error ", e.message);
        });
        ws.socket.addEventListener('message', e => {
            var d = ws.decode_msg(e.data);
            if (d != null) {
                ws.log("socket received:", d.event, d.data);
                ws.handle(d.event, d.data);
            } else {
                ws.log("socket received:", "invalid message", e.data);
            }
        });
        ws.socket.addEventListener('close', e => {
            ws.log("socket disconnected");
            ws.online = false;
            ws.reconnect();
        });
    },
    init: resolve => {
        ws.log("initializing");
        ws.connect(resolve);
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
                    url: (`${(app.secure ? 'https' : 'http')}://${app.bridge_ip}${url}`),
                    method: (`${method}`).toUpperCase(),
                    headers: headers,
                    json: data
                });
                console.log(response.body);
            } catch (error) {
                web.err("philips hue connect error", error);
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