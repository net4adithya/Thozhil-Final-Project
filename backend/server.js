// Main backend entry point
const path = require('path');
process.chdir(path.join(__dirname, 'apps', 'interview', 'server'));
require(path.join(__dirname, 'apps', 'interview', 'server', 'src', 'server.js'));
