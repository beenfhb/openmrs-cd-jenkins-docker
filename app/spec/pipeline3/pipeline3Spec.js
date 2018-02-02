describe('Tests suite for Pipeline3 ', function () {

  var folderInTest = __dirname + '/../../src/pipeline3/'
  var fs = require('fs')

  it('should implement all required functions from model', function () {

    var folderInTest = __dirname + '/../../src/pipeline3/'
    
    const fs = require('fs');
    const model = require(__dirname + '/../../src/models/model')
    const modelTestUtils = require(__dirname + '/../models/modelTestUtils')
  
    var serverFromJSON = JSON.parse(fs.readFileSync(__dirname + '/resources/server.json', 'utf8'))
  
    fs.readdirSync(folderInTest + 'impl/').forEach(file => {
      var type = file.split('.')[0]
      var server = new require(folderInTest + 'impl/' + type).getInstance(serverFromJSON)

      modelTestUtils.ensureImplmentedFunctions(server, model.Server)
    })
  })

  it('should return Setup script', function () {

   var serverFromJSON = JSON.parse(fs.readFileSync(__dirname + '/resources/server.json', 'utf8'))

   fs.readdirSync(folderInTest + 'impl/').forEach(file => {
    var type = file.split('.')[0]
    var server = new require(folderInTest + 'impl/' + type).getInstance(serverFromJSON)

    if (server.platform.type = "docker") {
       expect(server.getSetupScript().type).toEqual("#!/bin/bash")
    }

  })
 })
});