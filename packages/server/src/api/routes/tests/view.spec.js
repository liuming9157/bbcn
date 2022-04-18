const setup = require("./utilities")

function priceTable() {
  return {
    name: "table",
    type: "table",
    key: "name",
    schema: {
      Price: {
        type: "number",
        constraints: {},
      },
      Category: {
        type: "string",
        constraints: {
          type: "string",
        },
      },
    },
  }
}

describe("/views", () => {
  let request = setup.getRequest()
  let config = setup.getConfig()
  let table

  afterAll(setup.afterAll)

  beforeEach(async () => {
    await config.init()
  })

  describe("create", () => {
    beforeEach(async () => {
      table = await config.createTable(priceTable())
    })

    it("returns a success message when the view is successfully created", async () => {
      const res = await request
        .post(`/api/views`)
        .send({
          name: "TestView",
          field: "Price",
          calculation: "stats",
          tableId: table._id,
        })
        .set(config.defaultHeaders())
        .expect("Content-Type", /json/)
        .expect(200)

      expect(res.body.tableId).toBe(table._id)
    })

    it("updates the table row with the new view metadata", async () => {
      const res = await request
        .post(`/api/views`)
        .send({
          name: "TestView",
          field: "Price",
          calculation: "stats",
          tableId: table._id,
        })
        .set(config.defaultHeaders())
        .expect("Content-Type", /json/)
        .expect(200)
      expect(res.body.tableId).toBe(table._id)

      const updatedTable = await config.getTable(table._id)
      expect(updatedTable.views).toEqual({
        TestView: {
          field: "Price",
          calculation: "stats",
          tableId: table._id,
          filters: [],
          schema: {
            sum: {
              type: "number",
            },
            min: {
              type: "number",
            },
            max: {
              type: "number",
            },
            count: {
              type: "number",
            },
            sumsqr: {
              type: "number",
            },
            avg: {
              type: "number",
            },
            field: {
              type: "string",
            },
          },
        },
      })
    })
  })

  describe("fetch", () => {
    beforeEach(async () => {
      table = await config.createTable(priceTable())
    })

    it("returns only custom views", async () => {
      await config.createView({
        name: "TestView",
        field: "Price",
        calculation: "stats",
        tableId: table._id,
      })
      const res = await request
        .get(`/api/views`)
        .set(config.defaultHeaders())
        .expect("Content-Type", /json/)
        .expect(200)
      expect(res.body.length).toBe(1)
      expect(res.body.find(({ name }) => name === "TestView")).toBeDefined()
    })
  })

  describe("query", () => {
    beforeEach(async () => {
      table = await config.createTable(priceTable())
    })

    it("returns data for the created view", async () => {
      await config.createView({
        name: "TestView",
        field: "Price",
        calculation: "stats",
        tableId: table._id,
      })
      await config.createRow({
        tableId: table._id,
        Price: 1000,
      })
      await config.createRow({
        tableId: table._id,
        Price: 2000,
      })
      await config.createRow({
        tableId: table._id,
        Price: 4000,
      })
      const res = await request
        .get(`/api/views/TestView?calculation=stats`)
        .set(config.defaultHeaders())
        .expect("Content-Type", /json/)
        .expect(200)
      expect(res.body.length).toBe(1)
      expect(res.body).toMatchSnapshot()
    })

    it("returns data for the created view using a group by", async () => {
      await config.createView({
        calculation: "stats",
        name: "TestView",
        field: "Price",
        groupBy: "Category",
        tableId: table._id,
      })
      await config.createRow({
        tableId: table._id,
        Price: 1000,
        Category: "One",
      })
      await config.createRow({
        tableId: table._id,
        Price: 2000,
        Category: "One",
      })
      await config.createRow({
        tableId: table._id,
        Price: 4000,
        Category: "Two",
      })
      const res = await request
        .get(`/api/views/TestView?calculation=stats&group=Category`)
        .set(config.defaultHeaders())
        .expect("Content-Type", /json/)
        .expect(200)

      expect(res.body.length).toBe(2)
      expect(res.body).toMatchSnapshot()
    })
  })

  describe("destroy", () => {
    it("should be able to delete a view", async () => {
      const table = await config.createTable(priceTable())
      const view = await config.createView()
      const res = await request
        .delete(`/api/views/${view.name}`)
        .set(config.defaultHeaders())
        .expect("Content-Type", /json/)
        .expect(200)
      expect(res.body.map).toBeDefined()
      expect(res.body.meta.tableId).toEqual(table._id)
    })
  })

  describe("exportView", () => {
    it("should be able to export a view", async () => {
      await config.createTable(priceTable())
      await config.createRow()
      const view = await config.createView()
      let res = await request
        .get(`/api/views/export?view=${view.name}&format=json`)
        .set(config.defaultHeaders())
        .expect(200)
      let error
      try {
        const obj = JSON.parse(res.text)
        expect(obj.length).toBe(1)
      } catch (err) {
        error = err
      }
      expect(error).toBeUndefined()
      res = await request
        .get(`/api/views/export?view=${view.name}&format=csv`)
        .set(config.defaultHeaders())
        .expect(200)
      // this shouldn't be JSON
      try {
        JSON.parse(res.text)
      } catch (err) {
        error = err
      }
      expect(error).toBeDefined()
    })
  })
})
