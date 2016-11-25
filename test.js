var CANnoneer = require('./index');

function Test() {
	var Cannoneer = new CANnoneer();

	Cannoneer.start('vcan0');

	// Cannoneer.UDS.getSpeed().then(function(speed) {
	// 	console.log('Vehicle speed is', speed);
	// });

	// Cannoneer.onMessage({ id: 0x7E8, data: new Buffer([ 0x03, 0x41, 0x0D, 0x00]) }); // Fake vehicle speed response

	//Cannoneer.sendMessage(0x7E0, 0x02, 0x01, 0x05);

	//Cannoneer.sendMessage(0x7DF, 0x02, 0x01, 0x05);
	// Cannoneer.onMessage({ id: 0x7E8, data: new Buffer([ 0x03, 0x41, 0x05, 0x5A]) }); // Fake engine coolant temperature response

	Cannoneer.UDS.discoverDevices(0x00);
}


module.exports = exports = new Test();