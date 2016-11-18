var q = require('q');

function UDS(cannoneer) {
	this.cannoneer = cannoneer;
	this.cannoneer.on('onMessage', this.onMessage.bind(this));

	// 0x7DF = request
	// 0x7E8 = 0x7DF + 0x8 = possitive response
	// 0x7F = 0x7DF + 0x40 = negative response; ?
}

UDS.prototype.sendMessage = function(id, byte1, byte2, byte3, byte4, byte6, byte7, byte8) {
	this.deferred = q.defer();

	this.cannoneer.sendMessage.apply(this.cannoneer, arguments);

	return this.deferred.promise;
}

UDS.prototype.onMessage = function(id, byte1, byte2, byte3, byte4, byte6, byte7, byte8) {
	console.log('UDS: onMessage:', arguments);

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

UDS.prototype.getSpeed = function () { 

	console.log('UDS:','Requesting vehicle speed');

	var deferred = q.defer();

	this.sendMessage(0x7DF, 0x02, this.Modes.CurrentData, this.PIDS.Speed).then(function(bytes) {
		// TODO: calculate speed on response, which byte(s)/formula?
		deferred.resolve(bytes[4]);

	}).catch(function() {
		console.log('Request got rejected?');
		deferred.reject();
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