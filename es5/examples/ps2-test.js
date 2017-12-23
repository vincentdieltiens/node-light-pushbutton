'use strict';

var _ps = require('../ps2');

var _BuzzerNotFoundError = require('../BuzzerNotFoundError');

var buzzer = new _ps.Ps2Buzzer();

buzzer.addEventListener('ready', function () {
	console.log('Buzzer ready ! Push any button');
	var max = buzzer.controllersCount();

	// Turn off all lights
	for (var i = 0; i < max; i++) {
		buzzer.lightOff(i);
	}
});

buzzer.addEventListener('error', function (e) {
	console.log('error...', e);
});

buzzer.addEventListener('leave', function (e) {
	console.log('disconnected...', e);
});

// Buzzer pressing callback
// controllerIndex : 0 to 3 to tell with controller buzzed
// buttonIndex : 0 to 4 to tell with button has been pressed (0: big dome button, 1: blue, 2: orange: 3: green, 4: yellow)
buzzer.onPress(function (controllerIndex, buttonIndex) {
	console.log('buzz !', controllerIndex, buttonIndex);
	buzzer.blink(controllerIndex, 2, 100);
});

buzzer.connect(8000);
//# sourceMappingURL=ps2-test.js.map
