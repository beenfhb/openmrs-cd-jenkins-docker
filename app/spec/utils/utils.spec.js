"use strict";
describe("Utils", function() {
  const folderInTest = __dirname + "/../../src/utils/";
  const fs = require("fs");
  const utils = require(folderInTest + "utils");
  const model = require(folderInTest + "../models/model");

  it("should flatten environment variables", function() {
    var realDeepObject = {
      level1: {
        level2: {
          level3: {
            more: "stuff",
            other: "stuff",
            level4: {
              the: "end"
            }
          }
        },
        level2still: {
          last: "one"
        },
        am: "bored"
      },
      more: "stuff",
      ipsum: {
        lorem: "latin"
      }
    };

    var expectedResult =
      "level1_level2_level3_more=stuff\nlevel1_level2_level3_other=stuff\nlevel1_level2_level3_level4_the=end\nlevel1_level2still_last=one\nlevel1_am=bored\nmore=stuff\nipsum_lorem=latin\n";
    var envvar = utils.convertToEnvVar(realDeepObject);
    expect(envvar).toEqual(expectedResult);
  });

  it("should convert a list of dependencies sorted by serverId into a by artifact list", function() {
    var dependenciesByServer = JSON.parse(
      fs.readFileSync(
        __dirname + "/resources/test_server_artifacts.json",
        "utf8"
      )
    );
    var expectedResult = JSON.parse(
      fs.readFileSync(
        __dirname + "/resources/test_servers_by_artifact_keys.json",
        "utf8"
      )
    );

    var dependenciesByArtifact = utils.sortByArtifact(dependenciesByServer);

    expect(dependenciesByArtifact).toEqual(expectedResult);
  });

  it("should match servers by artifact key.", function() {
    // setup
    var serversByArtifactKeys = {
      "org.openmrs.module.emrapi-omod_1.22.1": ["id1", "id253"],
      "org.openmrs.module.providermanagement-omod_2.5.0": ["id1", "id253"],
      "org.openmrs.module.reporting-omod_1.14.0-SNAPSHOT": ["id1"],
      "org.openmrs.module.mksreports-omod_1.1.1-SNAPSHOT": ["id1"],
      "org.openmrs.module.metadatasharing-omod_1.2.2": ["id1", "id253"],
      "org.openmrs.module.uilibrary-omod_2.0.5": ["id1", "id253"],
      "org.openmrs.module.htmlwidgets-omod_1.8.0": ["id1", "id253"]
    };

    {
      // replay
      var matchedServers = utils.getServersByArtifactKey(
        serversByArtifactKeys,
        "org.openmrs.module.mksreports_1.1.1-SNAPSHOT"
      );

      // verif
      expect(matchedServers).toEqual(["id1"]);
    }
    {
      // replay
      var matchedServers = utils.getServersByArtifactKey(
        serversByArtifactKeys,
        "org.openmrs.module.mksreports_1.2"
      );

      // verif
      expect(matchedServers).toEqual([]);
    }
    {
      // replay
      var matchedServers = utils.getServersByArtifactKey(
        serversByArtifactKeys,
        "org.openmrs.module.emrapi_1.18.1"
      );

      // verif
      expect(matchedServers).toEqual([]);
    }
    {
      // replay/verif
      expect(function() {
        utils.getServersByArtifactKey(
          serversByArtifactKeys,
          "org.openmrs.module.emrapi"
        );
      }).toThrow();
    }
  });

  it("should get the matching servers and update the history log file", function() {
    var history = JSON.parse(
      fs.readFileSync(__dirname + "/resources/history.json", "utf8")
    );

    var dependencies = JSON.parse(
      fs.readFileSync(
        __dirname + "/resources/test_servers_by_artifact_keys.json",
        "utf8"
      )
    );

    var artifact = JSON.parse(
      fs.readFileSync(__dirname + "/resources/test_artifact1.json", "utf8")
    );
    utils.setMatchingServersAndUpdateHistory(
      dependencies,
      history,
      new model.ServerEvent(Date.now(), artifact)
    );
    expect(history.id1.serverEvents.length).toEqual(2);
    expect(history.id253.serverEvents.length).toEqual(3);

    var artifact2 = JSON.parse(
      fs.readFileSync(__dirname + "/resources/test_artifact2.json", "utf8")
    );
    utils.setMatchingServersAndUpdateHistory(
      dependencies,
      history,
      new model.ServerEvent(Date.now(), artifact2)
    );
    expect(history.id1.serverEvents.length).toEqual(3);
    expect(history.id253.serverEvents.length).toEqual(3);
  });

  it("should match instance in instances list.", function() {
    // setup
    var instancesList = [
      { uuid: "xyz", name: "bar" },
      { uuid: "abc", name: "baz" },
      { uuid: "cAcb5448", name: "foo" }
    ];

    {
      // replay
      var instance = utils.findInstanceInList("cAcb5448", "foo", instancesList);

      // verif
      expect(instance).toEqual({ uuid: "cAcb5448", name: "foo" });
    }
    {
      // replay
      var instance = utils.findInstanceInList(undefined, "foo", instancesList);

      // verif
      expect(instance).toEqual({ uuid: "cAcb5448", name: "foo" });
    }
    {
      // replay
      var instance = utils.findInstanceInList(
        "cAcb5448",
        undefined,
        instancesList
      );

      // verif
      expect(instance).toEqual({ uuid: "cAcb5448", name: "foo" });
    }
    {
      // replay / verif
      expect(function() {
        utils.findInstanceInList("xyz", "baz", instancesList);
      }).toThrow();
    }

    // setup
    instancesList.push({ uuid: "cAcb5448", name: "foo" });

    {
      // replay / verif
      expect(function() {
        utils.findInstanceInList("cAcb5448", undefined, instancesList);
      }).toThrow();
    }
    {
      // replay / verif
      expect(function() {
        utils.findInstanceInList("cAcb5448", "foo", instancesList);
      }).toThrow();
    }
    {
      // replay / verif
      expect(function() {
        utils.findInstanceInList(undefined, "foo", instancesList);
      }).toThrow();
    }
  });

  it("should set status and basic audit info to objects.", function() {
    const MockDate = require("mockdate");

    MockDate.set("2015-03-30T13:09:53.867Z");

    // setup
    var obj = {};

    // replay
    utils.setObjectStatus(obj, "created");

    // verif
    expect(obj.status).toEqual("created");
    expect(obj.created).toEqual(obj.updated);
    expect(obj.updated instanceof Date).toBe(true);

    MockDate.set("2015-03-30T13:09:53.868Z");

    // replay
    utils.setObjectStatus(obj, "updated");

    // verif
    expect(obj.status).toEqual("updated");
    expect(obj.updated).toBeGreaterThan(obj.created);

    MockDate.reset();

    // setup
    var obj = { status: "foobar" };

    // replay
    utils.setObjectStatus(obj);

    // verif
    expect(obj.status).toEqual("foobar");
    expect(obj.created).toEqual(obj.updated);
    expect(obj.updated instanceof Date).toBe(true);

    // setup
    var obj = null;

    // replay
    utils.setObjectStatus(obj, "created");

    // verif: null remains null
    expect(obj).toEqual(null);

    // setup
    var obj = undefined;

    // replay
    utils.setObjectStatus(obj, "created");

    // verif: undefined remains undefined
    expect(obj).toEqual(undefined);
  });
});
