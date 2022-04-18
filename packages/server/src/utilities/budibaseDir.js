const { join } = require("./centralPath")
const { homedir } = require("os")
const env = require("../environment")
const { budibaseTempDir } = require("@budibase/backend-core/objectStore")

module.exports.budibaseAppsDir = function () {
  return env.BUDIBASE_DIR || join(homedir(), ".budibase")
}

module.exports.budibaseTempDir = budibaseTempDir
