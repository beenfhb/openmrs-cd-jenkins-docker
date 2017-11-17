var model = require('../../models/model')
var utils = require('../../utils/utils')
var fs = require('fs')

module.exports = {

  getInstance: function() {

    var project = new model.Project();

    // Implement here the Project object methods
    project.getBuildScriptAsString = function () {
      return utils.getScriptAsString(getBuildScript());
    }
    project.getBuildScript = function () {
      return getBuildScript();
    }
    project.getArtifactFile = function (pomPath) {
      var artifact = new model.ArtifactFile();

      artifact.extension = "zip"
      artifact.path = "./target"

      var pom = utils.getPom(pomPath);
      artifact.version = pom.version
      artifact.name = pom.artifactId
      artifact.module = ""        
      artifact.groupId = pom.groupId

      artifact.filename = artifact.name + "-" + artifact.version + "." + artifact.extension
      artifact.destFilename = artifact.filename

      return artifact
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
  buildScript.comments = "# Autogenerated script to build 'bahmniconfig' type of projects"
  buildScript.value = "mvn clean install\n"

  return buildScript    
}

var getDeployScript = function() {

  var deployScript = new model.Script();

  deployScript.type = "#!/bin/bash"
  deployScript.comments = "# Autogenerated script to deploy 'bahmniconfig' type of projects"
  deployScript.value = "nexus_envvars=$1 ; . $nexus_envvars\n"
  deployScript.value = deployScript.value + "mvn clean deploy -DskipTests -DaltDeploymentRepository=${NEXUS_REPO_ID}::default::${ARTIFACT_UPLOAD_URL_bahmniconfig}"  +"\n"

  return deployScript    
}
