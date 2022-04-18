const { tmpdir } = require("os")
const env = require("../src/environment")

env._set("SELF_HOSTED", "1")
env._set("NODE_ENV", "jest")
env._set("JWT_SECRET", "test-jwtsecret")
env._set("CLIENT_ID", "test-client-id")
env._set("BUDIBASE_DIR", tmpdir("budibase-unittests"))
env._set("LOG_LEVEL", "silent")
env._set("PORT", 0)

global.console.log = jest.fn() // console.log are ignored in tests
