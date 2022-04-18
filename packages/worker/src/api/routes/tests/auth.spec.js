jest.mock("nodemailer")
const setup = require("./utilities")
const sendMailMock = setup.emailMock()

const TENANT_ID = "default"

describe("/api/global/auth", () => {
  let request = setup.getRequest()
  let config = setup.getConfig()
  let code

  beforeAll(async () => {
    await config.init()
  })

  afterAll(setup.afterAll)

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should be able to generate password reset email", async () => {
    // initially configure settings
    await config.saveSmtpConfig()
    await config.saveSettingsConfig()
    await config.createUser()
    const res = await request
      .post(`/api/global/auth/${TENANT_ID}/reset`)
      .send({
        email: "test@test.com",
      })
      .expect("Content-Type", /json/)
      .expect(200)
    expect(res.body).toEqual({ message: "Please check your email for a reset link." })
    expect(sendMailMock).toHaveBeenCalled()
    const emailCall = sendMailMock.mock.calls[0][0]
    // after this URL there should be a code
    const parts = emailCall.html.split(`http://localhost:10000/builder/auth/reset?code=`)
    code = parts[1].split("\"")[0].split("&")[0]
    expect(code).toBeDefined()
  })

  it("should allow resetting user password with code", async () => {
    const res = await request
      .post(`/api/global/auth/${TENANT_ID}/reset/update`)
      .send({
        password: "newpassword",
        resetCode: code,
      })
      .expect("Content-Type", /json/)
      .expect(200)
    expect(res.body).toEqual({ message: "password reset successfully." })
  })

  describe("oidc", () => {
    const auth = require("@budibase/backend-core/auth")

    // mock the oidc strategy implementation and return value
    strategyFactory = jest.fn()
    mockStrategyReturn = jest.fn()
    strategyFactory.mockReturnValue(mockStrategyReturn)
    auth.oidc.strategyFactory = strategyFactory

    const passportSpy = jest.spyOn(auth.passport, "authenticate")
    let oidcConf
    let chosenConfig
    let configId

    beforeEach(async () => {
      oidcConf = await config.saveOIDCConfig()
      chosenConfig = oidcConf.config.configs[0]
      configId = chosenConfig.uuid
    })

    afterEach(() => {
      expect(strategyFactory).toBeCalledWith(
        chosenConfig, 
        `http://localhost:10000/api/global/auth/${TENANT_ID}/oidc/callback`
      )
    })

    describe("oidc configs", () => {
      it("should load strategy and delegate to passport", async () => {
        await request.get(`/api/global/auth/${TENANT_ID}/oidc/configs/${configId}`)

        expect(passportSpy).toBeCalledWith(mockStrategyReturn, {
          scope: ["profile", "email"],
        })
        expect(passportSpy.mock.calls.length).toBe(1);
      })
    })

    describe("oidc callback", () => {
      it("should load strategy and delegate to passport", async () => {
        await request.get(`/api/global/auth/${TENANT_ID}/oidc/callback`)
                     .set(config.getOIDConfigCookie(configId))
      
        expect(passportSpy).toBeCalledWith(mockStrategyReturn, {
          successRedirect: "/", failureRedirect: "/error" 
        }, expect.anything())
        expect(passportSpy.mock.calls.length).toBe(1);
      })
    })

  })
})
