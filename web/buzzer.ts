/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../node_modules/@types/ip/index.d.ts" />
/// <reference path="../node_modules/@types/express/index.d.ts" />
/// <reference path="./typings/nodejs-websocket.d.ts" />

'use strict';

import * as ip from 'ip';
import * as ws from 'nodejs-websocket';
import { Buzzer } from '../buzzer';
import * as express from 'express';

function callHandlers(handlers:Array<Function>, controllerIndex:number, buttonIndex:number) {
	if (!handlers) {
		return;
	}

	for (var i in handlers) {
		handlers[i](controllerIndex, buttonIndex);
	}
}

export class WebBuzzer implements Buzzer {
	// The websocket server, Connection & port
	ws: ws.Server;
	conn: ws.Connection;
	port: number;

	// Express ap
	app: express.Express;

	// listeners
	handlers: Array<Array<Function>>;

	eventListeners: { 'ready': Array<Function>, 'leave': Array<Function> };

	constructor(app:express.Express, port:number=8083) {
		this.port = port;
		this.app = app;
		this.handlers = [];

		this.eventListeners = { 'ready': [], 'leave': [] };
		
		this.initWebapp()
		this.initWebsocket()
	}

	addEventListener(event: string, callback: Function) {
		this.eventListeners[event].push(callback);
		if (event == 'ready' && this.conn) {
			callback();
		}
	}

	removeEventListener(event: string, callback: Function) {
		var index = this.eventListeners[event].indexOf(callback);
		this.eventListeners[event].splice(index, 1);
	}

	leave(): void {
		this.ws.close();
	}

	lightOn(controllerIndexes:any) {
		this.conn.send(JSON.stringify({
			'lights': controllerIndexes,
			'on': true
		}));
	}

	lightOff(controllerIndexes:any) {
		this.conn.send(JSON.stringify({
			'lights': controllerIndexes,
			'on': false
		}));
	}
	
	blink(controllerIndexes:Array<number>, times:number=5, duration:number=0.2) {
	}

	onPress(callback: Function, controllerIndex?:number, buttonIndex?:number): Function {
		var key = 'all';
		if (controllerIndex != undefined || buttonIndex != undefined) {
			key = '';
			if (controllerIndex != undefined) {
				key = 'c'+controllerIndex;
			}
			if (buttonIndex != undefined) {
				key += 'b'+buttonIndex
			}
		}

		if (!(key in this.handlers)) {
			this.handlers[key] = [];
		}
		this.handlers[key].push(callback);
		return () => {
			var index = this.handlers[key].indexOf(callback);
			if (index >= 0) {
				this.handlers[key].splice(index, 1);
			}
		};		
	}
	
	initWebapp() {
		this.app.get('/buzzer', (request, response) => {
			response.render('buzzer', {
				ip: ip.address(),
				port: this.port
			})
		});
	}

	initWebsocket() {
		console.log('WebBuzzer : listening ws on '+this.port);
		this.ws = ws.createServer((conn) => {
			this.conn = conn;

			this.eventListeners['ready'].forEach((f) => {
				f();
			});

			conn.on("text", (str:string) => {
				var data = JSON.parse(str);
				
				if (data.press != undefined) {
					var controllerIndex = data.press;
					var buttonIndex = 0;
					
					var key = 'c'+controllerIndex;
					callHandlers(this.handlers[key], controllerIndex, buttonIndex);

					callHandlers(this.handlers['all'], controllerIndex, buttonIndex);					
				}
			});

			conn.on("close", (code:number, reason:string) => {
				this.conn = null;
				this.eventListeners['leave'].forEach((f) => {
					f();
				});
			});
		}).listen(this.port);
	}

	controllersCount():number {
		return 4;
	}
}