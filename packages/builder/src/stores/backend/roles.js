import { writable } from "svelte/store"
import { API } from "api"

export function createRolesStore() {
  const { subscribe, update, set } = writable([])

  const actions = {
    fetch: async () => {
      const roles = await API.getRoles()
      set(roles)
    },
    delete: async role => {
      await API.deleteRole({
        roleId: role?._id,
        roleRev: role?._rev,
      })
      update(state => state.filter(existing => existing._id !== role._id))
    },
    save: async role => {
      const savedRole = await API.saveRole(role)
      await actions.fetch()
      return savedRole
    },
  }

  return {
    subscribe,
    ...actions,
  }
}

export const roles = createRolesStore()
