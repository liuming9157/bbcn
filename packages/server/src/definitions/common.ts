export { Query, Datasource } from "./datasource"

export interface Base {
  _id?: string
  _rev?: string
}

export interface Application extends Base {
  appId?: string
}

export interface FieldSchema {
  // TODO: replace with field types enum when done
  type: string
  fieldName?: string
  name: string
  tableId?: string
  relationshipType?: string
  through?: string
  foreignKey?: string
  autocolumn?: boolean
  throughFrom?: string
  throughTo?: string
  formula?: string
  formulaType?: string
  main?: boolean
  meta?: {
    toTable: string
    toKey: string
  }
  constraints?: {
    type?: string
    email?: boolean
    inclusion?: string[]
    length?: {
      minimum?: string | number
      maximum?: string | number
    }
    presence?: boolean
  }
}

export interface TableSchema {
  [key: string]: FieldSchema
}

export interface Table extends Base {
  type?: string
  views?: {}
  name: string
  primary?: string[]
  schema: TableSchema
  primaryDisplay?: string
  sourceId?: string
  relatedFormula?: string[]
  constrained?: string[]
}

export interface Row extends Base {
  type?: string
  tableId?: string
  [key: string]: any
}

interface JsonSchemaField {
  properties: {
    [key: string]: {
      type: string
      title: string
      customType?: string
    }
  }
  required?: string[]
}

export interface AutomationStep {
  description: string
  event?: string
  icon: string
  id: string
  inputs: {
    [key: string]: any
  }
  name: string
  schema: {
    inputs: JsonSchemaField
    outputs: JsonSchemaField
  }
  stepId: string
  tagline: string
  type: string
}

export interface Automation extends Base {
  name: string
  type: string
  appId?: string
  definition: {
    steps: AutomationStep[]
    trigger?: AutomationStep
  }
}
