"use strict";
describe("Tests suite for pipeline1", function() {
  it("should verify job parameters.", function() {
    // deps
    const __rootPath__ = require("app-root-path").path;
    const fs = require("fs");
    const config = require(__dirname + "/../../src/utils/config");

    // replay
    var jenkinsFile = fs.readFileSync(
      __rootPath__ +
        "/../jenkins/jenkins_home/jobs/" +
        config.getJobNameForPipeline1() +
        "/config.xml",
      "utf8"
    );

    // verif
    expect(jenkinsFile).toContain(
      "<name>" + config.varProjectType() + "</name>"
    );
    expect(jenkinsFile).toContain("<name>" + config.varRepoUrl() + "</name>");
    expect(jenkinsFile).toContain("<name>" + config.varRepoName() + "</name>");
    expect(jenkinsFile).toContain(
      "<name>" + config.varBranchName() + "</name>"
    );
    expect(jenkinsFile).toContain("<name>" + config.varCommitId() + "</name>");
    expect(jenkinsFile).toContain(
      "<scriptPath>jobs/pipelines/" +
        config.getJobNameForPipeline1() +
        ".jenkinsfile</scriptPath>"
    );
  });

  it("should verify pipeline steps scripts.", function() {
    // deps
    const __rootPath__ = require("app-root-path").path;
    const fs = require("fs");
    const config = require(__dirname + "/../../src/utils/config");

    // replay
    var jenkinsFile = fs.readFileSync(
      __rootPath__ +
        "/../jobs/pipelines/" +
        config.getJobNameForPipeline1() +
        ".jenkinsfile",
      "utf8"
    );

    // verif 'checkout' stage
    expect(jenkinsFile).toContain(
      "git url: " + config.varRepoUrl() + ", branch: " + config.varBranchName()
    );

    // verif 'build' stage
    expect(jenkinsFile).toContain(
      "sh 'node /opt/app/src/$JOB_NAME/" +
        config.getBuildJsScriptName() +
        " " +
        config.getCommitMetadataFilePath() +
        "'"
    );
    expect(jenkinsFile).toContain(
      "sh '$WORKSPACE/" + config.getBuildShellScriptName() + "'"
    );
    expect(jenkinsFile).toContain(
      "sh '. " +
        config.getChangedArtifactEnvvarsPath() +
        " ; mv $WORKSPACE/$" +
        config.varBuildPath() +
        "/$" +
        config.varFilename() +
        " $WORKSPACE/$" +
        config.varDestFilename() +
        "'"
    );

    // verif 'deploy' stage
    expect(jenkinsFile).toContain(
      "sh '$WORKSPACE/" +
        config.getDeployShellScriptName() +
        " $JENKINS_HOME/" +
        config.getArtifactRepoEnvvarsName() +
        "'"
    );
  });

  it("should generate build and deploy scripts", function() {
    // deps
    const proxyquire = require("proxyquire");
    const model = require(__dirname + "/../../src/models/model");
    const os = require("os");
    const fs = require("fs");

    // setup
    process.env.projectType = "artifact_type"; // eg. 'openmrsmodule'
    process.env.WORKSPACE = os.tmpdir();

    const buildScript = "__build_script__";
    const deployScript = "__deploy_script__";
    var mockBuild = new model.ProjectBuild();
    mockBuild.getBuildScriptAsString = function() {
      return buildScript;
    };
    mockBuild.getDeployScriptAsString = function(artifact) {
      return deployScript;
    };

    var stubs = {};
    stubs["./impl/" + process.env.projectType] = {
      getInstance: function() {
        return mockBuild;
      },
      "@noCallThru": true
    };

    // replay
    proxyquire(__dirname + "/../../src/pipeline1/build.js", stubs);

    // verif
    expect(
      fs.readFileSync(process.env.WORKSPACE + "/build.sh", "utf8")
    ).toEqual(buildScript);
    expect(
      fs.readFileSync(process.env.WORKSPACE + "/deploy.sh", "utf8")
    ).toEqual(deployScript);
  });

  it("should implement all required functions from data model.", function() {
    var folderInTest = __dirname + "/../../src/pipeline1/";

    const fs = require("fs");
    const model = require(__dirname + "/../../src/models/model");
    const modelTestUtils = require(__dirname + "/../models/modelTestUtils");

    // Running tests on each file present in the  folderInTest folder and ensure they correctly implement every needed function
    fs.readdirSync(folderInTest + "impl/").forEach(file => {
      var type = file.split(".")[0];
      var projectBuild = new require(
        folderInTest + "impl/" + type
      ).getInstance();

      modelTestUtils.ensureImplementedFunctions(
        projectBuild,
        model.ProjectBuild
      );

      var metadata = {
        commit: 123456
      };

      var artifact = projectBuild.getArtifact(
        __dirname + "/resources/" + type + "/",
        metadata
      );

      modelTestUtils.ensureImplementedFunctions(artifact, model.Artifact);
    });
  });

  it("should getArtifact, getBuildScript and getDeployScript for 'bahmniapps'.", function() {
    const model = require(__dirname + "/../../src/models/model");
    const projectType = "bahmniapps";
    var folderInTest = __dirname + "/../../src/pipeline1/";
    var projectBuild = require(folderInTest +
      "./impl/" +
      projectType).getInstance();

    var mockCommitMetadata = {
      branchName: "dev",
      commitId: "12fe45"
    };

    var artifact = projectBuild.getArtifact("./", mockCommitMetadata);

    // replay with branch specified
    expect(artifact.name).toEqual("bahmniapps");
    expect(artifact.version).toEqual("dev");
    expect(artifact.extension).toEqual("zip");
    expect(artifact.filename).toEqual("bahmniapps.zip");
    expect(artifact.destFilename).toEqual("bahmniapps-dev.zip");
    expect(artifact.buildPath).toEqual("./ui/target");
    expect(artifact.mavenProject).toEqual(
      new model.MavenProject("net.mekomsolutions", "bahmniapps", "dev")
    );

    // replay with no branch specified
    mockCommitMetadata.branchName = "";
    artifact = projectBuild.getArtifact("./", mockCommitMetadata);
    expect(artifact.destFilename).toEqual("bahmniapps-12fe45.zip");
    expect(artifact.mavenProject).toEqual(
      new model.MavenProject("net.mekomsolutions", "bahmniapps", "12fe45")
    );

    // verif
    var buildScript = projectBuild.getBuildScript();
    expect(buildScript.type).toEqual("#!/bin/bash");
    expect(buildScript.value.indexOf("/scripts/package.sh\n") > -1).toBe(true);

    var deployScript = projectBuild.getDeployScript(artifact);
    expect(deployScript.type).toEqual("#!/bin/bash");
    expect(deployScript.value.indexOf("mvn deploy:deploy-file") > -1).toBe(
      true
    );
  });

  it("should getArtifact, getBuildScript and getDeployScript for 'bahmniconfig'.", function() {
    // deps
    const model = require(__dirname + "/../../src/models/model");
    const projectType = "bahmniconfig";
    const folderInTest = __dirname + "/../../src/pipeline1/";

    // replay
    var projectBuild = require(folderInTest +
      "./impl/" +
      projectType).getInstance();

    var artifact = projectBuild.getArtifact(
      __dirname + "/resources/" + projectType + "/",
      null
    );
    var buildScript = projectBuild.getBuildScript();
    var deployScript = projectBuild.getDeployScript(artifact);

    // verif
    expect(artifact.name).toEqual("bahmni-config-cambodia");
    expect(artifact.version).toEqual("1.0-SNAPSHOT");

    expect(artifact.extension).toEqual("zip");
    expect(artifact.filename).toEqual(
      "bahmni-config-cambodia-1.0-SNAPSHOT.zip"
    );
    expect(artifact.destFilename).toEqual(artifact.filename);
    expect(artifact.buildPath).toEqual("./target");
    expect(artifact.mavenProject).toEqual(
      new model.MavenProject(
        "net.mekomsolutions",
        "bahmni-config-cambodia",
        "1.0-SNAPSHOT"
      )
    );

    expect(buildScript.type).toEqual("#!/bin/bash");
    expect(buildScript.value).toEqual("mvn clean install\n");

    expect(deployScript.type).toEqual("#!/bin/bash");
    expect(
      deployScript.value.indexOf("mvn clean deploy -DskipTests") > -1
    ).toBe(true);
  });

  it("should getArtifact, getBuildScript and getDeployScript for 'openmrsconfig'.", function() {
    // deps
    const model = require(__dirname + "/../../src/models/model");
    const projectType = "openmrsconfig";

    // setup
    var folderInTest = __dirname + "/../../src/pipeline1/";

    // replay
    var projectBuild = require(folderInTest +
      "./impl/" +
      projectType).getInstance();
    var artifact = projectBuild.getArtifact(
      __dirname + "/resources/" + projectType + "/",
      null
    );
    var buildScript = projectBuild.getBuildScript();
    var deployScript = projectBuild.getDeployScript(artifact);

    // verif
    expect(artifact.name).toEqual("openmrs-config-cambodia");
    expect(artifact.version).toEqual("1.0-SNAPSHOT");
    expect(artifact.extension).toEqual("zip");
    expect(artifact.filename).toEqual(
      "openmrs-config-cambodia-1.0-SNAPSHOT.zip"
    );
    expect(artifact.destFilename).toEqual(artifact.filename);
    expect(artifact.buildPath).toEqual("./target");
    expect(artifact.mavenProject).toEqual(
      new model.MavenProject(
        "net.mekomsolutions",
        "openmrs-config-cambodia",
        "1.0-SNAPSHOT"
      )
    );

    expect(buildScript.type).toEqual("#!/bin/bash");
    expect(buildScript.value).toEqual("mvn clean install\n");

    expect(deployScript.type).toEqual("#!/bin/bash");
    expect(true).toBe(
      deployScript.value.indexOf("mvn clean deploy -DskipTests") > -1
    );
  });

  it("should getArtifact, getBuildScript and getDeployScript for 'openmrscore'.", function() {
    // deps
    const model = require(__dirname + "/../../src/models/model");
    const projectType = "openmrscore";

    // setup
    var folderInTest = __dirname + "/../../src/pipeline1/";

    // replay
    var projectBuild = require(folderInTest +
      "./impl/" +
      projectType).getInstance();

    var artifact = projectBuild.getArtifact(
      __dirname + "/resources/" + projectType + "/",
      null
    );
    var buildScript = projectBuild.getBuildScript();
    var deployScript = projectBuild.getDeployScript(artifact);

    // verif
    expect(artifact.name).toEqual("openmrs");
    expect(artifact.version).toEqual("2.2.0-SNAPSHOT");
    expect(artifact.extension).toEqual("omod");
    expect(artifact.filename).toEqual("openmrs-2.2.0-SNAPSHOT.omod");
    expect(artifact.destFilename).toEqual(artifact.filename);
    expect(artifact.buildPath).toEqual("./omod/target");
    expect(artifact.mavenProject).toEqual(
      new model.MavenProject("org.openmrs", "openmrs", "2.2.0-SNAPSHOT")
    );

    expect(buildScript.type).toEqual("#!/bin/bash");
    expect(buildScript.value).toEqual("mvn clean install\n");

    expect(deployScript.type).toEqual("#!/bin/bash");
    expect(true).toBe(
      deployScript.value.indexOf("mvn clean deploy -DskipTests") > -1
    );
  });

  it("should getArtifact, getBuildScript and getDeployScript for 'openmrsmodule'.", function() {
    // setup
    const projectType = "openmrsmodule";
    var folderInTest = __dirname + "/../../src/pipeline1/";

    // replay
    var projectBuild = require(folderInTest +
      "./impl/" +
      projectType).getInstance();
    var artifact = projectBuild.getArtifact(
      __dirname + "/resources/" + projectType + "/",
      null
    );
    var buildScript = projectBuild.getBuildScript();
    var deployScript = projectBuild.getDeployScript(artifact);

    // verif
    expect(artifact.name).toEqual("exti18n");
    expect(artifact.version).toEqual("1.1.0-SNAPSHOT");
    expect(artifact.extension).toEqual("omod");
    expect(artifact.filename).toEqual("exti18n-1.1.0-SNAPSHOT.omod");
    expect(artifact.destFilename).toEqual(artifact.filename);
    expect(artifact.buildPath).toEqual("./omod/target");

    expect(buildScript.type).toEqual("#!/bin/bash");
    expect(buildScript.value).toEqual("mvn clean install\n");

    expect(deployScript.type).toEqual("#!/bin/bash");
    expect(true).toBe(
      deployScript.value.indexOf("mvn clean deploy -DskipTests") > -1
    );
  });
});
