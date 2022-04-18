const { getRowParams, USER_METDATA_PREFIX } = require("../../db/utils")
const CouchDB = require("../../db")
const { isDevAppID, getDevelopmentAppID } = require("@budibase/backend-core/db")

const ROW_EXCLUSIONS = [USER_METDATA_PREFIX]

const getAppPairs = appIds => {
  // collect the app ids into dev / prod pairs
  // keyed by the dev app id
  const pairs = {}
  for (let appId of appIds) {
    const devId = getDevelopmentAppID(appId)
    if (!pairs[devId]) {
      pairs[devId] = {}
    }
    if (isDevAppID(appId)) {
      pairs[devId].devId = appId
    } else {
      pairs[devId].prodId = appId
    }
  }
  return pairs
}

const getAppRows = async appId => {
  // need to specify the app ID, as this is used for different apps in one call
  const appDb = new CouchDB(appId)
  const response = await appDb.allDocs(
    getRowParams(null, null, {
      include_docs: false,
    })
  )
  return response.rows
    .map(r => r.id)
    .filter(id => {
      for (let exclusion of ROW_EXCLUSIONS) {
        if (id.startsWith(exclusion)) {
          return false
        }
      }
      return true
    })
}

/**
 * Return a set of all rows in the given app ids.
 * The returned rows will be unique on a per dev/prod app basis.
 * Rows duplicates may exist across apps due to data import so they are not filtered out.
 */
exports.getUniqueRows = async appIds => {
  let uniqueRows = []
  const pairs = getAppPairs(appIds)

  for (let pair of Object.values(pairs)) {
    let appRows = []
    for (let appId of [pair.devId, pair.prodId]) {
      if (!appId) {
        continue
      }
      try {
        appRows.push(await getAppRows(appId))
      } catch (e) {
        console.error(e)
        // don't error out if we can't count the app rows, just continue
      }
    }

    // ensure uniqueness on a per app pair basis
    // this can't be done on all rows because app import results in
    // duplicate row ids across apps
    uniqueRows = uniqueRows.concat(...new Set(appRows))
  }

  return uniqueRows
}
