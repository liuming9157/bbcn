const Sentry = require("@sentry/node")
const { ViewNames, getQueryIndex } = require("../utils")
const { FieldTypes } = require("../../constants")
const { createLinkView } = require("../views/staticViews")
const { getAppDB } = require("@budibase/backend-core/context")

/**
 * Only needed so that boolean parameters are being used for includeDocs
 * @type {{EXCLUDE: boolean, INCLUDE: boolean}}
 */
exports.IncludeDocs = {
  INCLUDE: true,
  EXCLUDE: false,
}

exports.createLinkView = createLinkView

/**
 * Gets the linking documents, not the linked documents themselves.
 * @param {string} args.tableId The table which we are searching for linked rows against.
 * @param {string|null} args.fieldName The name of column/field which is being altered, only looking for
 * linking documents that are related to it. If this is not specified then the table level will be assumed.
 * @param {string|null} args.rowId The ID of the row which we want to find linking documents for -
 * if this is not specified then it will assume table or field level depending on whether the
 * field name has been specified.
 * @param {boolean|null} args.includeDocs whether to include docs in the response call, this is considerably slower so only
 * use this if actually interested in the docs themselves.
 * @returns {Promise<object[]>} This will return an array of the linking documents that were found
 * (if any).
 */
exports.getLinkDocuments = async function (args) {
  const { tableId, rowId, includeDocs } = args
  const db = getAppDB()
  let params
  if (rowId != null) {
    params = { key: [tableId, rowId] }
  }
  // only table is known
  else {
    params = { startKey: [tableId], endKey: [tableId, {}] }
  }
  params.include_docs = !!includeDocs
  try {
    let linkRows = (await db.query(getQueryIndex(ViewNames.LINK), params)).rows
    // filter to get unique entries
    const foundIds = []
    linkRows = linkRows.filter(link => {
      // make sure anything unique is the correct key
      if (
        (tableId && link.key[0] !== tableId) ||
        (rowId && link.key[1] !== rowId)
      ) {
        return false
      }
      const unique = foundIds.indexOf(link.id) === -1
      if (unique) {
        foundIds.push(link.id)
      }
      return unique
    })

    if (includeDocs) {
      return linkRows.map(row => row.doc)
    } else {
      return linkRows.map(row => row.value)
    }
  } catch (err) {
    // check if the view doesn't exist, it should for all new instances
    if (err != null && err.name === "not_found") {
      await exports.createLinkView()
      return exports.getLinkDocuments(arguments[0])
    } else {
      /* istanbul ignore next */
      Sentry.captureException(err)
    }
  }
}

exports.getUniqueByProp = (array, prop) => {
  return array.filter((obj, pos, arr) => {
    return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos
  })
}

exports.getLinkedTableIDs = table => {
  return Object.values(table.schema)
    .filter(column => column.type === FieldTypes.LINK)
    .map(column => column.tableId)
}

exports.getLinkedTable = async (id, tables) => {
  const db = getAppDB()
  let linkedTable = tables.find(table => table._id === id)
  if (linkedTable) {
    return linkedTable
  }
  linkedTable = await db.get(id)
  if (linkedTable) {
    tables.push(linkedTable)
  }
  return linkedTable
}

exports.getRelatedTableForField = (table, fieldName) => {
  // look to see if its on the table, straight in the schema
  const field = table.schema[fieldName]
  if (field != null) {
    return field.tableId
  }
  for (let column of Object.values(table.schema)) {
    if (column.type === FieldTypes.LINK && column.fieldName === fieldName) {
      return column.tableId
    }
  }
  return null
}
