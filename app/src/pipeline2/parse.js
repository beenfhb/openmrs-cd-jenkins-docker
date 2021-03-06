"use strict";

/**
 * @author Romain Buisson (romain@mekomsolutions.com)
 *
 */

const fs = require("fs");
const utils = require("../utils/utils");
const config = require("../utils/config");
const log = require("npmlog");

var descriptorsDir = "/tmp";
var descriptors = JSON.parse(
  fs.readFileSync(descriptorsDir + "/descriptors.json")
);

var dependenciesByServer = {};

descriptors.forEach(function(item) {
  var descriptor = require("./impl/" + item.type).getInstance(
    item.id,
    item.descriptor
  );
  dependenciesByServer[item.id] = descriptor.getDependencies();
});

var byArtifact = utils.sortByArtifact(dependenciesByServer);
log.info("", byArtifact);
fs.writeFileSync(
  config.getServersByArtifactKeysPath(),
  JSON.stringify(byArtifact, null, 2)
);
