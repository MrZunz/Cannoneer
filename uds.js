var q = require('q');

function UDS(cannoneer) {
	this.cannoneer = cannoneer;
	this.cannoneer.on('onMessage', this.onMessage.bind(this));

	this.responseTimeout = 100;
	// 0x7DF = OBD2 request
	// 0x7E8 = 0x7DF + 0x8 = possitive response
	// 0x7F = 0x7DF + 0x40 = negative response; ?
}

UDS.prototype.sendMessage = function(id, byte1, byte2, byte3, byte4, byte6, byte7, byte8) {
	
	var me = this;
	this.deferred = q.defer();

	this.deferred.promise.timeout(this.responseTimeout).then(
		function (result) {
			// will be called if the promise resolves normally
			//console.log(result);
		},
		function (err) {
			// will be called if the promise is rejected, or the timeout occurs
			//console.log(err);
			me.deferred.reject(err);
		}
	);

	this.cannoneer.sendMessage.apply(this.cannoneer, arguments);

	return this.deferred.promise;
}

UDS.prototype.onMessage = function(id, byte1, byte2, byte3, byte4, byte6, byte7, byte8) {
	//console.log('UDS: onMessage:', arguments);

	var bytes = [];
	for (var i = 0; i < arguments.length; ++i) {
		bytes[i] = arguments[i];
	}

	if(id == 0x7E8) {
		this.deferred.resolve(bytes);
	}
	else {
		this.deferred.reject();
	}
}

UDS.prototype.discoverDevices = function(arbitrationID) {
	var min = 0x00;
	var max = 0xFF;
	//var current = arbitrationID;

	// if(!current) {
	// 	current = min;
	// 	console.log('setting current to 0x00')
	// }

	var me = this;

	console.log('Sending diagnostics Tester Present to 0x' + arbitrationID.toString(16).toUpperCase());

	this.sendMessage(arbitrationID, 0x02, 0x10, 0x01).then(function(bytes) {
		// TODO: Check response
		console.log('Found something at arbitrationID 0x' + arbitrationID.toString(16).toUpperCase());
		//me.discoverDevices(arbitrationID++);
	}).catch(function(err) {
		console.log('Found nothing at 0x' + arbitrationID.toString(16).toUpperCase(), 'going to try', arbitrationID + 0x01);
		me.discoverDevices(arbitrationID + 0x01);
	});
}

UDS.prototype.getSpeed = function () { 

	console.log('UDS:','Requesting vehicle speed');

	var me = this;
	var deferred = q.defer();

	this.sendMessage(0x7DF, 0x02, this.Modes.CurrentData, this.PIDS.Speed).then(function(bytes) {
		// TODO: calculate speed on response, which byte(s)/formula?
		deferred.resolve(bytes[4]);

	}).catch(function(err) {
		console.log('Vehicle speed request failed:', err);
		deferred.reject(err);
	});

	return deferred.promise;
};

UDS.prototype.ErrorResponses = {
	"GeneralReject": 0x10,
	"ServiceNotSupported": 0x11,
	"SubFunctionNotSupported": 0x12,
	"IncorrectMessageLengthOrInvalidFormat": 0x13,
	"ResponseTooLong": 0x14,
	"BusyRepeatRequest": 0x21,
	"ConditionNotCorrect": 0x22,
	"RequestSequenceError": 0x24,
	// ADD MORE
}

UDS.prototype.Modes = {
	"CurrentData": 0x01,
	"FreezeFrame": 0x02,
	// ADD MORE
}

UDS.prototype.PIDS = {
	"CoolantTemperature": 0x05,
	"Speed": 0x0D,
	// ADD MORE
}


module.exports = UDS;