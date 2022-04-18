/**
 * Script to replicate your PouchDb (in your home directory) to a remote CouchDB
 * USAGE...
 * node scripts/replicateApp <app_name> <remote_url>
 * e.g. node scripts/replicateApp Mike http://admin:password@127.0.0.1:5984
 */

const CouchDB = require("../src/db")
const { DocumentTypes } = require("../src/db/utils")
const { getAllDbs } = require("@budibase/backend-core/db")

const appName = process.argv[2].toLowerCase()
const remoteUrl = process.argv[3]

console.log(`Replicating from ${appName} to ${remoteUrl}/${appName}`)

const run = async () => {
  const dbs = await getAllDbs()
  const appDbNames = dbs.filter(dbName => dbName.startsWith("inst_app"))
  let apps = []
  for (let dbName of appDbNames) {
    const db = new CouchDB(dbName)
    apps.push(db.get(DocumentTypes.APP_METADATA))
  }
  apps = await Promise.all(apps)
  const app = apps.find(
    a => a.name === appName || a.name.toLowerCase() === appName
  )

  if (!app) {
    console.log(
      `Could not find app... apps: ${apps.map(app => app.name).join(", ")}`
    )
    return
  }

  const instanceDb = new CouchDB(app.appId)
  const remoteDb = new CouchDB(`${remoteUrl}/${appName}`)

  instanceDb.replicate
    .to(remoteDb)
    .on("complete", function () {
      console.log("SUCCESS!")
    })
    .on("error", function (err) {
      console.log(`FAILED: ${err}`)
    })
}

run()
