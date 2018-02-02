/**
* @author Romain Buisson (romain@mekomsolutions.com)
*
*/
var fs = require('fs');
var utils = require('../utils/utils')

var server = ""
try {
  server = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
} catch (err) {
  console.log("Server JSON file not present or not provided as argument. Exiting...")
  console.log(err)
  process.exit(1)
}

// The Server implementation is loaded based on what the platform type is
var server = require('./impl/' + server.platform.type).getInstance(server);

// Retrieve the details of the artifact that will be built
var setupScript = server.getSetupScriptAsString()

// Retrieve the script to pull the platform
fs.writeFileSync(process.env.WORKSPACE + "/setup.sh", setupScript)
fs.chmodSync(process.env.WORKSPACE + "/setup.sh", 0755);
