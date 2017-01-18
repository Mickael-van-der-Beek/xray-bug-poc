'use strict';

const webserver = require('../src/webserver');

webserver.listen(error => {
	if (error) {
		throw error;
	}

	console.log(`Listening`);
});
