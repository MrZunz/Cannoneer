var q = require('q');

function UDS(cannoneer) {
	this.cannoneer = cannoneer;
	this.cannoneer.on('onMessage', this.onMessage.bind(this));

	this.responseTimeout = 100;
	// 0x7DF = request
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

// UDS.prototype.discoverDevices = function(arbitrationID) {
// 	var min = 0x00;
// 	var max = 0xFF;
// 	//var current = arbitrationID;

// 	// if(!current) {
// 	// 	current = min;
// 	// 	console.log('setting current to 0x00')
// 	// }

// 	var me = this;

// 	console.log('Sending diagnostics Tester Present to 0x' + arbitrationID.toString(16).toUpperCase());

// 	this.sendMessage(arbitrationID, 0x02, 0x10, 0x01).then(function(bytes) {
// 		// TODO: Check response
// 		console.log('Found something at arbitrationID 0x' + arbitrationID.toString(16).toUpperCase());
// 		//me.discoverDevices(arbitrationID++);
// 	}).catch(function(err) {
// 		console.log('Found nothing at 0x' + arbitrationID.toString(16).toUpperCase(), 'going to try', arbitrationID + 0x01);
// 		me.discoverDevices(arbitrationID + 0x01);
// 	});
// }

UDS.prototype.getSpeed = function () { 

	console.log('UDS:','Requesting vehicle speed');

	var me = this;
	var deferred = q.defer();

	this.sendMessage(0x7DF, 0x02, this.Services.CurrentData, this.PIDS.Speed).then(function(bytes) {
		// TODO: calculate speed on response, which byte(s)/formula?
		deferred.resolve(bytes[4]);

	}).catch(function(err) {
		console.log('Vehicle speed request failed:', err);
		deferred.reject(err);
	});

	return deferred.promise;
};

// OBDII Services (Modes)
UDS.prototype.Services = {
	"CurrentData": 	0x01,		// This mode returns the common values for some sensors such as engine speed, rpm, etc
	"FreezeFrame": 	0x02,		// This mode gives the freeze frame (or instantaneous) data of a fault. When a fault is detected by the ECM, it records the sensor data at a specific moment when the fault appears.
	"StoredDTC": 	0x03,		// This mode shows the stored diagnostic trouble codes.
	"ClearDTC": 	0x04, 		// This mode is used to clear recorded fault codes and switch off the engine fault indicator.
	"Mode5": 		0x05, 		// This mode gives the results of self-diagnostics done on the oxygen/lamda sensors. It mainly applies only to petrol vehicles. For new ECUs using CAN, this mode is no longer used. Mode 6 replaces the functions that were available in Mode 5.
	"Mode6": 		0x06,		// This mode gives the results of self-diagnostics done on systems not subject to constant surveillance.
	"Mode7": 		0x07,		// This mode gives unconfirmed fault codes. It is very useful after a repair to check that the fault code does not reappear without having to do a long test run. The codes used are identical to those in mode 3.
	"Mode8": 		0x08,		// This mode gives the results of self-diagnostics on other systems. It is hardly used in Europe.
	"VehicleInformation": 0x09, // This mode gives the information concerning the vehicle, such as the VIN & calibration values
	"PermanentDTC": 0x0A,		// This mode gives the permanent fault codes. The codes used are identical to those in modes 3 and 7. Unlike modes 3 and 7, these codes cannot be cleared using mode 4. Only several road cycles with no appearance of the problem can clear the fault.
}

// ISO - 14229: Enhanced Diagnostics (we're not using them all but here they are anyway)
UDS.prototype.EnhancedServices = {
	"DiagnosticSessionControl": 	0x10,
	"ECUReset": 					0x11,
	"ClearDiagnosticInformation": 	0x14,
	"ReadDiagnosticTroubleCodes": 	0x19,
	"ReadDataByID": 				0x22,
	"ReadMemoryByAddress": 			0x23,
	"ReadScalingDataByID":			0x24,
	"SecurityAccess": 				0x27,
	"CommunicationsControl": 		0x28,
	"ReadDataByPeriodic ID": 		0x2A,
	"DynamicallyDefineDataID":		0x2C,
	"WriteDataByID": 				0x2E,
	"InputOutputControl": 			0x2F,
	"RoutineControl": 				0x31,
	"RequestDownload": 				0x34,
	"RequestUpload": 				0x35,
	"TransferData": 				0x36,
	"RequestTransferExit": 			0x37,
	"WriteMemoryByAddress": 		0x3D,
	"TesterPresent": 				0x3E,
	"AccessTimingParameter": 		0x83,
	"SecuredDataTransmission": 		0x84,
	"ControlDTCSetting": 			0x85,
	"ResponseOnEvent": 				0x86,
	"LinkControl": 					0x87
}

// OBDII PIDS (services) 
// The OBD standard (updated in 2007) includes 137 PIDs, so I'm only going to list the ones I am interested in
UDS.prototype.PIDS = {
	"EngineLoad":			0x04,
	"CoolantTemperature": 	0x05,
	"RPM": 					0x0C,
	"Speed": 				0x0D,
	"ThrottlePosition":		0x11,
	// ADD MORE
}

UDS.prototype.ErrorResponses = {
	"GeneralReject": 							0x10,
	"ServiceNotSupported": 						0x11,
	"SubFunctionNotSupported": 					0x12,
	"IncorrectMessageLengthOrInvalidFormat": 	0x13,
	"ResponseTooLong": 							0x14,
	"BusyRepeatRequest": 						0x21,
	"ConditionNotCorrect": 						0x22,
	"RequestSequenceError": 					0x24,
	// ADD MORE
}

module.exports = UDS;