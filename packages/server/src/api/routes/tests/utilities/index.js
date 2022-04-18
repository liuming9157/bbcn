const TestConfig = require("../../../../tests/utilities/TestConfiguration")
const structures = require("../../../../tests/utilities/structures")
const env = require("../../../../environment")

function user() {
  return {
    _id: "user",
    _rev: "rev",
    createdAt: Date.now(),
    email: "test@test.com",
    roles: {},
    tenantId: "default",
    status: "active",
  }
}

jest.mock("../../../../utilities/workerRequests", () => ({
  getGlobalUsers: jest.fn(() => {
    return {
      _id: "us_uuid1",
    }
  }),
  getGlobalSelf: jest.fn(() => {
    return {
      _id: "us_uuid1",
    }
  }),
  allGlobalUsers: jest.fn(() => {
    return [user()]
  }),
  readGlobalUser: jest.fn(() => {
    return user()
  }),
  saveGlobalUser: jest.fn(() => {
    return { _id: "user", _rev: "rev" }
  }),
  deleteGlobalUser: jest.fn(() => {
    return { message: "deleted user" }
  }),
  removeAppFromUserRoles: jest.fn(),
}))

exports.delay = ms => new Promise(resolve => setTimeout(resolve, ms))

let request, config

exports.beforeAll = () => {
  config = new TestConfig()
  request = config.getRequest()
}

exports.afterAll = () => {
  if (config) {
    config.end()
  }
  // clear app files

  request = null
  config = null
}

exports.getRequest = () => {
  if (!request) {
    exports.beforeAll()
  }
  return request
}

exports.getConfig = () => {
  if (!config) {
    exports.beforeAll()
  }
  return config
}

exports.switchToSelfHosted = async func => {
  // self hosted stops any attempts to Dynamo
  env._set("NODE_ENV", "production")
  env._set("SELF_HOSTED", true)
  let error
  try {
    await func()
  } catch (err) {
    error = err
  }
  env._set("NODE_ENV", "jest")
  env._set("SELF_HOSTED", false)
  // don't throw error until after reset
  if (error) {
    throw error
  }
}

exports.structures = structures
