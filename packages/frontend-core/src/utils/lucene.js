import { Helpers } from "@budibase/bbui"
import { OperatorOptions } from "../constants"

/**
 * Returns the valid operator options for a certain data type
 * @param type the data type
 */
export const getValidOperatorsForType = type => {
  const Op = OperatorOptions
  const stringOps = [
    Op.Equals,
    Op.NotEquals,
    Op.StartsWith,
    Op.Like,
    Op.Empty,
    Op.NotEmpty,
  ]
  const numOps = [
    Op.Equals,
    Op.NotEquals,
    Op.MoreThan,
    Op.LessThan,
    Op.Empty,
    Op.NotEmpty,
  ]
  if (type === "string") {
    return stringOps
  } else if (type === "number") {
    return numOps
  } else if (type === "options") {
    return [Op.Equals, Op.NotEquals, Op.Empty, Op.NotEmpty]
  } else if (type === "array") {
    return [Op.Contains, Op.NotContains, Op.Empty, Op.NotEmpty]
  } else if (type === "boolean") {
    return [Op.Equals, Op.NotEquals, Op.Empty, Op.NotEmpty]
  } else if (type === "longform") {
    return stringOps
  } else if (type === "datetime") {
    return numOps
  } else if (type === "formula") {
    return stringOps.concat([Op.MoreThan, Op.LessThan])
  }
  return []
}

/**
 * Operators which do not support empty strings as values
 */
export const NoEmptyFilterStrings = [
  OperatorOptions.StartsWith.value,
  OperatorOptions.Like.value,
  OperatorOptions.Equals.value,
  OperatorOptions.NotEquals.value,
  OperatorOptions.Contains.value,
  OperatorOptions.NotContains.value,
]

/**
 * Removes any fields that contain empty strings that would cause inconsistent
 * behaviour with how backend tables are filtered (no value means no filter).
 */
const cleanupQuery = query => {
  if (!query) {
    return query
  }
  for (let filterField of NoEmptyFilterStrings) {
    if (!query[filterField]) {
      continue
    }
    for (let [key, value] of Object.entries(query[filterField])) {
      if (!value || value === "") {
        delete query[filterField][key]
      }
    }
  }
  return query
}

/**
 * Builds a lucene JSON query from the filter structure generated in the builder
 * @param filter the builder filter structure
 */
export const buildLuceneQuery = filter => {
  let query = {
    string: {},
    fuzzy: {},
    range: {},
    equal: {},
    notEqual: {},
    empty: {},
    notEmpty: {},
    contains: {},
    notContains: {},
  }
  if (Array.isArray(filter)) {
    filter.forEach(expression => {
      let { operator, field, type, value } = expression
      // Parse all values into correct types
      if (type === "datetime" && value) {
        value = new Date(value).toISOString()
      }
      if (type === "number") {
        value = parseFloat(value)
      }
      if (type === "boolean") {
        value = `${value}`?.toLowerCase() === "true"
      }
      if (operator.startsWith("range")) {
        if (!query.range[field]) {
          query.range[field] = {
            low:
              type === "number"
                ? Number.MIN_SAFE_INTEGER
                : "0000-00-00T00:00:00.000Z",
            high:
              type === "number"
                ? Number.MAX_SAFE_INTEGER
                : "9999-00-00T00:00:00.000Z",
          }
        }
        if (operator === "rangeLow" && value != null && value !== "") {
          query.range[field].low = value
        } else if (operator === "rangeHigh" && value != null && value !== "") {
          query.range[field].high = value
        }
      } else if (query[operator]) {
        if (type === "boolean") {
          // Transform boolean filters to cope with null.
          // "equals false" needs to be "not equals true"
          // "not equals false" needs to be "equals true"
          if (operator === "equal" && value === false) {
            query.notEqual[field] = true
          } else if (operator === "notEqual" && value === false) {
            query.equal[field] = true
          } else {
            query[operator][field] = value
          }
        } else {
          query[operator][field] = value
        }
      }
    })
  }

  return query
}

/**
 * Performs a client-side lucene search on an array of data
 * @param docs the data
 * @param query the JSON lucene query
 */
export const runLuceneQuery = (docs, query) => {
  if (!docs || !Array.isArray(docs)) {
    return []
  }
  if (!query) {
    return docs
  }

  // make query consistent first
  query = cleanupQuery(query)

  // Iterates over a set of filters and evaluates a fail function against a doc
  const match = (type, failFn) => doc => {
    const filters = Object.entries(query[type] || {})
    for (let i = 0; i < filters.length; i++) {
      const [key, testValue] = filters[i]
      const docValue = Helpers.deepGet(doc, key)
      if (failFn(docValue, testValue)) {
        return false
      }
    }
    return true
  }

  // Process a string match (fails if the value does not start with the string)
  const stringMatch = match("string", (docValue, testValue) => {
    return (
      !docValue || !docValue?.toLowerCase().startsWith(testValue?.toLowerCase())
    )
  })

  // Process a fuzzy match (treat the same as starts with when running locally)
  const fuzzyMatch = match("fuzzy", (docValue, testValue) => {
    return (
      !docValue || !docValue?.toLowerCase().startsWith(testValue?.toLowerCase())
    )
  })

  // Process a range match
  const rangeMatch = match("range", (docValue, testValue) => {
    return !docValue || docValue < testValue.low || docValue > testValue.high
  })

  // Process an equal match (fails if the value is different)
  const equalMatch = match("equal", (docValue, testValue) => {
    return testValue != null && testValue !== "" && docValue !== testValue
  })

  // Process a not-equal match (fails if the value is the same)
  const notEqualMatch = match("notEqual", (docValue, testValue) => {
    return testValue != null && testValue !== "" && docValue === testValue
  })

  // Process an empty match (fails if the value is not empty)
  const emptyMatch = match("empty", docValue => {
    return docValue != null && docValue !== ""
  })

  // Process a not-empty match (fails is the value is empty)
  const notEmptyMatch = match("notEmpty", docValue => {
    return docValue == null || docValue === ""
  })

  // Match a document against all criteria
  const docMatch = doc => {
    return (
      stringMatch(doc) &&
      fuzzyMatch(doc) &&
      rangeMatch(doc) &&
      equalMatch(doc) &&
      notEqualMatch(doc) &&
      emptyMatch(doc) &&
      notEmptyMatch(doc)
    )
  }

  // Process all docs
  return docs.filter(docMatch)
}

/**
 * Performs a client-side sort from the equivalent server-side lucene sort
 * parameters.
 * @param docs the data
 * @param sort the sort column
 * @param sortOrder the sort order ("ascending" or "descending")
 * @param sortType the type of sort ("string" or "number")
 */
export const luceneSort = (docs, sort, sortOrder, sortType = "string") => {
  if (!sort || !sortOrder || !sortType) {
    return docs
  }
  const parse = sortType === "string" ? x => `${x}` : x => parseFloat(x)
  return docs.slice().sort((a, b) => {
    const colA = parse(a[sort])
    const colB = parse(b[sort])
    if (sortOrder === "Descending") {
      return colA > colB ? -1 : 1
    } else {
      return colA > colB ? 1 : -1
    }
  })
}

/**
 * Limits the specified docs to the specified number of rows from the equivalent
 * server-side lucene limit parameters.
 * @param docs the data
 * @param limit the number of docs to limit to
 */
export const luceneLimit = (docs, limit) => {
  const numLimit = parseFloat(limit)
  if (isNaN(numLimit)) {
    return docs
  }
  return docs.slice(0, numLimit)
}
