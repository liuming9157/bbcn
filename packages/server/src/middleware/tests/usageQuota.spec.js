jest.mock("../../db")
jest.mock("../../utilities/usageQuota")
jest.mock("@budibase/backend-core/tenancy", () => ({
  getTenantId: () => "testing123"
}))

const usageQuotaMiddleware = require("../usageQuota")
const usageQuota = require("../../utilities/usageQuota")
const CouchDB = require("../../db")
const env = require("../../environment")

class TestConfiguration {
  constructor() {
    this.throw = jest.fn()
    this.next = jest.fn()
    this.middleware = usageQuotaMiddleware
    this.ctx = {
      throw: this.throw,
      next: this.next,
      appId: "test",
      request: {
        body: {}
      },
      req: {
        method: "POST",
        url: "/applications"
      }
    }
    usageQuota.useQuotas = () => true
  }

  executeMiddleware() {
    return this.middleware(this.ctx, this.next)
  }

  setProd(bool) {
    if (bool) {
      env.isDev = () => false
      env.isProd = () => true
      this.ctx.user = { tenantId: "test" }
    } else {
      env.isDev = () => true
      env.isProd = () => false
    }
  }

  setMethod(method) {
    this.ctx.req.method = method
  }

  setUrl(url) {
    this.ctx.req.url = url
  }

  setBody(body) {
    this.ctx.request.body = body
  }

  setFiles(files) {
    this.ctx.request.files = { file: files }
  }
}

describe("usageQuota middleware", () => {
  let config

  beforeEach(() => {
    config = new TestConfiguration()
  })

  it("skips the middleware if there is no usage property or method", async () => {
    await config.executeMiddleware()
    expect(config.next).toHaveBeenCalled()
  })

  it("passes through to next middleware if document already exists", async () => {
    config.setProd(true)
    config.setBody({
      _id: "test",
      _rev: "test",
    })

    CouchDB.mockImplementationOnce(() => ({ 
      get: async () => true
    }))

    await config.executeMiddleware()

    expect(config.next).toHaveBeenCalled()
  })

  it("throws if request has _id, but the document no longer exists", async () => {
    config.setBody({
      _id: "123",
      _rev: "test",
    })
    config.setProd(true)

    CouchDB.mockImplementationOnce(() => ({ 
      get: async () => {
        throw new Error()
      } 
    }))

    await config.executeMiddleware()
    expect(config.throw).toHaveBeenCalledWith(404, `${config.ctx.request.body._id} does not exist`)
  })

  it("calculates and persists the correct usage quota for the relevant action", async () => {
    config.setUrl("/rows")

    await config.executeMiddleware()

    expect(usageQuota.update).toHaveBeenCalledWith("rows", 1)
    expect(config.next).toHaveBeenCalled()
  })

  // it("calculates the correct file size from a file upload call and adds it to quota", async () => {
  //   config.setUrl("/upload")
  //   config.setProd(true)
  //   config.setFiles([
  //     {
  //       size: 100
  //     },
  //     {
  //       size: 10000
  //     },
  //   ])
  //   await config.executeMiddleware()

  //   expect(usageQuota.update).toHaveBeenCalledWith("storage", 10100)
  //   expect(config.next).toHaveBeenCalled()
  // })
})