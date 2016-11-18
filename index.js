var util = require('util');
var EventEmitter = require('events').EventEmitter;
var can = require('socketcan');
var uds = require('./uds');

util.inherits(Cannoneer, EventEmitter);

function Cannoneer() {
	console.log("Cannoneer v0.1 loaded!");

	var me = this;
	// this.API = {};
	this.UDS = new uds(this);

	// Add functions from UDS to Cannoneers API
	// for(var fn in me.UDS.API) {
	// 	console.log('Adding method', fn, 'to Cannoneers API');
	// 	me.API[fn] = me.UDS.API[fn];
	// }
}

Cannoneer.prototype.start = function(interface) {
	if(can == null) { 
		console.err('socketcan not initialized, cannot start.'); 
	}

	// Start listening to data on the canbus 
	this.channel = can.createRawChannel(interface, true);
	this.channel.addListener("onMessage", this.onMessage.bind(this));
	this.channel.start();

	console.log("Cannoneer started listening on interface", interface);
}

Cannoneer.prototype.sendMessage = function(id, byte1, byte2, byte3, byte4, byte5, byte6, byte7, byte8) {

	// Check if we are passing a Number instead of anything else, to prevent stupid me from passing strings like "0x7A"
	var error = false;
	for(var argument in arguments) {
		if(typeof arguments[argument] !== "number") {
			console.log('You idiot,', arguments[argument], 'is not typeof number');
			error = true;
		}
	}

	if(error) { return; }

	// Construct new frame to be sent to the can bus through socketcan
	var msg = { id: id, data: new Buffer(arguments.length - 1) };

	// Write bytes to buffer
	for(var i = 0; i < msg.data.length; i++) {
		var byte = arguments[i + 1];
		if(typeof byte !== "undefined") {
			msg.data.writeInt8(byte, i);
		}
	}

	// console.log('Cannoneer sending:', msg.id.toString(16).toUpperCase(), msg.data);
	console.log('Cannoneer sending:', msg);
	this.channel.send(msg);
}

Cannoneer.prototype.onMessage = function(msg) {
	console.log('Cannoneer received:', msg.id.toString(16).toUpperCase(), msg.data);

	// convert from data buffer to array to we can pass it as function arguments
	var args = [];
	args[0] = 'onMessage';
	args[1] = msg.id;
	for (var i = 0; i < msg.data.length; i++) {
		var byte = msg.data[i];
		args[i + 2] = byte;
	}

	this.emit.apply(this, args)
}

// module.exports = exports = new Cannoneer();
module.exports = Cannoneer;