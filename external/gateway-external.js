/*
 *  phue bridge gateway service
 *  network external sector
 */

const utils = require('../utils');

const fs = require('fs');
const http = require('http');
const websocket = require('ws');

// environment
const args = process.argv.slice(2);
const env = args[0] == 'prod' ? 'prod' : 'dev';
const config = JSON.parse(fs.readFileSync('../config.json', { encoding: 'utf8', flag: 'r' }));

// main class
const app = {

    // constants
    name: "phue bridge gateway service (external)",
    ws_port: (env === 'prod' ? config.ws_port : 8081),
    http_port: (env === 'prod' ? config.http_port : 8080),
    secure: config.secure,

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

// websocket service
const ws = {
    socket: null,
    online: false,
    clients: {},  // client sockets
    events: {},  // event handlers
    gateway_res: {},
    await_response: (client, request, resolve) => {
        const req_id = utils.rand_id();
        ws.gateway_res[req_id] = {
            id: req_id, complete: false, callback: request => {
                if (request.id === req_id)
                    resolve(request.data);
            }
        };
        ws.send_to_client('phue_gateway_req', {
            id: req_id,
            request: request
        }, client);
    },
    attach_events: _ => {
        ws.bind('identity', (client, req) => {
            if (req.key === config.key) {
                for (var c_id in ws.clients) {
                    if (ws.clients.hasOwnProperty(c_id) && ws.clients[c_id] !== null) {
                        if (c_id != client.id)
                            ws.clients[c_id].target = false;
                    }
                }
                client.target = true;
                ws.send_to_client('identity', { success: true }, client);
                ws.log("identified gateway client target");
            } else {
                ws.send_to_client('identity', { success: false }, client);
            }
        });
        ws.bind('phue_gateway_res', (client, req) => {
            if (ws.gateway_res[req.id].complete == false) {
                ws.gateway_res[req.id].complete = true;
                ws.gateway_res[req.id].callback(req);
            }
        });
    },
    has_target_client: _ => {
        for (var c_id in ws.clients) {
            if (
                ws.clients.hasOwnProperty(c_id) &&
                ws.clients[c_id] !== null
            ) {
                if (ws.clients[c_id].target === true)
                    return true;
            }
        }
        return false;
    },
    get_target_client: _ => {
        for (var c_id in ws.clients) {
            if (
                ws.clients.hasOwnProperty(c_id) &&
                ws.clients[c_id] !== null
            ) {
                if (ws.clients[c_id].target === true)
                    return ws.clients[c_id];
            }
        }
        return null;
    },
    // ws wrapper infra
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
            ws.err("invalid json msg", e);
            m = null;
        }
        return m;
    },
    send_to_client: (event, data, client) => {  // send data to specific authenticated non-arduino client
        client.socket.send(ws.encode_msg(event, data));
    },
    send_to_clients: (event, data) => {  // send data to all authenticated non-arduino clients
        for (var c_id in ws.clients) {
            if (
                ws.clients.hasOwnProperty(c_id) &&
                ws.clients[c_id] !== null
            ) {
                ws.clients[c_id].socket.send(ws.encode_msg(event, data));
            }
        }
    },
    send_to_clients_but: (event, data, client) => {  // send data to almost all authenticated non-arduino clients (excluding one)
        for (var c_id in ws.clients) {
            if (
                ws.clients.hasOwnProperty(c_id) &&
                c_id != client.id &&
                ws.clients[c_id] !== null
            ) {
                ws.clients[c_id].socket.send(ws.encode_msg(event, data));
            }
        }
    },
    bind: (event, handler) => {  // bind handler to client event
        ws.events[event] = (client, req) => {
            handler(client, req);
        };
    },
    initialize_socket: (resolve) => {  // initialize & attach events
        ws.socket = new websocket.Server({ port: app.ws_port });
        // attach server socket events
        ws.socket.on('connection', (client_socket) => {
            // create client object on new connection
            var client = {
                socket: client_socket,
                id: utils.rand_id(),
                target: false
            };
            ws.log(`client ${client.id} – connected`);
            // client socket event handlers
            client.socket.addEventListener('message', (m) => {
                var d = ws.decode_msg(m.data); // parse message
                if (d != null) {
                    // console.log('    ', d.event, d.data);
                    ws.log(`client ${client.id} – message: ${d.event}`, d.data);
                    // handle various events
                    if (ws.events.hasOwnProperty(d.event))
                        ws.events[d.event](client, d.data);
                    else ws.err("unknown event", d.event);
                } else {
                    ws.err(`client ${client.id} – invalid message: `, m.data);
                }
            });
            client.socket.addEventListener('error', (e) => {
                ws.err(`client ${client.id} – error`, e);
            });
            client.socket.addEventListener('close', (c, r) => {
                ws.log(`client ${client.id} – disconnected`);
                delete ws.clients[client.id]; // remove client object on disconnect
            });
            // add client object to client object list
            ws.clients[client.id] = client;
        });
        ws.socket.on('listening', _ => {
            ws.log("listening on", app.ws_port);
            ws.online = true;
            if (resolve) resolve();
        });
        ws.socket.on('error', (e) => {
            ws.log("server error", e);
            ws.online = false;
        });
        ws.socket.on('close', _ => {
            ws.log("server closed");
            ws.online = false;
        });

        // attach client socket events
        ws.attach_events();
    },
    init: resolve => {
        ws.log("initializing");
        ws.initialize_socket(resolve);
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
    handle_event: (req, res, ep, data) => {
        console.log("\t");
        web.log("received request")
        console.log("url: \t\t", req.url);
        console.log("endpoint: \t", ep);
        console.log("method: \t", req.method);
        console.log("headers: \n", req.headers);
        console.log("data: \n", data);
        console.log("\t");

        // send req to websocket, wait for response, send back response to phue client
        if (ws.has_target_client()) {
            ws.await_response(ws.get_target_client(), {
                url: req.url,
                method: req.method,
                headers: req.headers,
                data: data
            }, response => {
                console.log("\t");
                web.log("received response from gateway");
                console.log(response);
                console.log("\t");
                res.end(response);
            });
        } else {
            // return error
            res.end();
        }
    },
    // web infra
    initialize_server: resolve => {
        web.request_handler = (req, res) => {
            let body_data = '';
            req.on('data', chunk => { body_data += chunk; });
            req.on('end', _ => {
                web.handle_event(req, res, (`${req.url}`).split('/').slice(1), body_data);
            });
        };
        if (resolve) resolve();
    },
    init: resolve => {
        web.log("initializing");
        web.initialize_server(_ => {
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
        if (resolve) resolve();
    }
};


// entry point
app.link(app.main);