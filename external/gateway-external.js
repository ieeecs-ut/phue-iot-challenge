/*
 *  phue bridge gateway service
 *  network external sector
 */

const websocket = require('ws');
const express = require('express');
const body_parse = require('body-parser');

// main class
const app = {
    main: _ => {
        console.log('phue bridge gateway service');
        console.log('network external sector');
        console.log('');
        web.init(_ => {
            ws.init(_ => {
                console.log('ready');
            });
        });
    },
    ws: null,
    web: null,
    link: resolve => {
        app.ws = ws;
        app.web = web;
        if (resolve) resolve();
    }
};

// websocket service
const ws = {
    init: resolve => {

        if (resolve) resolve();
    }
};


// web service
const web = {
    init: resolve => {
        if (resolve) resolve();
    }
};


// entry point
app.link(app.main);