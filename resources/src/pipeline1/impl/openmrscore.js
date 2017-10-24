var model = require('../model')
var utils = require('../../utils/utils')
var fs = require('fs')

module.exports = {

  getInstance: function() {

    var project = new model.Project();

    // Implement here the Project object methods
    project.getBuildScript = function () {
      return getBuildScript();
    }
    project.getArtifact = function (pomPath) {
      var artifact = new model.Artifact();

      artifact.extension = "omod"
      artifact.path = "./omod/target"

      var pom = utils.getPom(pomPath);
      artifact.version = pom.version
      artifact.name = pom.artifactId

      artifact.filename = artifact.name + "-" + artifact.version + "." + artifact.extension
      artifact.destFilename = artifact.filename
      
      return artifact
    }
    project.getDeployScript = function () {
      return getDeployScript();
    }
    project.getDeployScript = function () {
      return getDeployScript()
    }

    return project
  } 
}

var getBuildScript = function() {

  var buildScript = new model.Script();

  buildScript.type = "#!/bin/bash"
  buildScript.comments = "# Autogenerated script to build 'openmrscore' type of projects"
  buildScript.value = "mvn clean install\n"

  return buildScript    
}

var getDeployScript = function() {

  var deployScript = new model.Script();

  deployScript.type = "#!/bin/bash"
  deployScript.comments = "# Autogenerated script to deploy 'openmrscore' type of projects"
  deployScript.value = "mvn clean deploy -DskipTests\n"

  return deployScript    
}