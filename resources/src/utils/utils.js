var XML = require('pixl-xml');
var fs = require('fs')

module.exports = {

  /**
  * @return Returns a concatenated string of all the properties of the passed object
  */
  convertToEnvVar: function (object) {
    var envvars = ""

    for (var property in object) {
      if (object.hasOwnProperty(property)) {
        envvars = envvars + property + "=" + object[property] + "\n";
      }
    }
    return envvars
  },
  getPom: function (pomPath) {

    var file = fs.readFileSync(pomPath + 'pom.xml', 'utf8')
    var parsedPom = XML.parse(file)

    return parsedPom;
  },
  sortByArtifact: function (dependenciesByServer) {

    var dependenciesByArtifact = {}

    for (var property in dependenciesByServer) {
      if (dependenciesByServer.hasOwnProperty(property)) {
        var dependenciesForAServer = dependenciesByServer[property].dependencies
        for (var i = 0; i < dependenciesForAServer.length; i++) {
          var dep = dependenciesForAServer[i]
          var key = dep.groupId + "." + dep.artifactId + "_" + dep.version
          if(dependenciesByArtifact.hasOwnProperty(key)) {
            dependenciesByArtifact[key].push(property)
          } else {
            dependenciesByArtifact[key] = [property]
          }
        }
      }
    }
    return dependenciesByArtifact
  },
  getScriptAsString: function (script) {

    var string = ""
    if (script != null) {
      string = script.type
      string = string + "\n\n"
      string = string + script.comments
      string = string + "\n\n"
      string = string + script.value
    }
    return string
  },
  /*
  * identifies the servers that have a dependency on the 'artifact' and updates the 'history' 
  *
  */
  setMatchingServersAndUpdateHistory: function (artifact, dependencies, history) {
    var suffix = artifact.module ? "-" + artifact.module : ""    
    var key = artifact.groupId + "." + artifact.name + suffix + "_" + artifact.version
    var servers = dependencies[key]
    if (servers) {
      for (var i = 0; i < servers.length; i++) {
        if (history[servers[i]]) {
          history[servers[i]].artifacts_history.push(artifact)
        } else {
          history[servers[i]] = {
            "artifacts_history": []
          }
          history[servers[i]].artifacts_history.push(artifact)
        }
      }
    } else {
      console.log("[WARN] No server found matching the provided artifact")
      console.log("Artifact: " + key)
    }
  }
}
