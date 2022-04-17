<script>
  import { createEventDispatcher } from "svelte"
  import { Body, Select, ModalContent, notifications } from "@budibase/bbui"
  import { users } from "stores/portal"

  export let app
  export let user

  const NO_ACCESS = "NO_ACCESS"

  const dispatch = createEventDispatcher()

  const roles = app.roles
  let options = roles
    .filter(role => role._id !== "PUBLIC")
    .map(role => ({ value: role._id, label: role.name }))
  options.push({ value: NO_ACCESS, label: "No Access" })
  let selectedRole = user?.roles?.[app?._id]

  async function updateUserRoles() {
    try {
      if (selectedRole === NO_ACCESS) {
        // Remove the user role
        const filteredRoles = { ...user.roles }
        delete filteredRoles[app?._id]
        await users.save({
          ...user,
          roles: {
            ...filteredRoles,
          },
        })
      } else {
        // Add the user role
        await users.save({
          ...user,
          roles: {
            ...user.roles,
            [app._id]: selectedRole,
          },
        })
      }
      notifications.success("角色更新成功")
      dispatch("update")
    } catch (error) {
      notifications.error("Failed to update role")
    }
  }
</script>

<ModalContent
  onConfirm={updateUserRoles}
  title="更新应用角色"
  confirmText="更新角色"
  cancelText="取消"
  size="M"
  showCloseIcon={false}
>
  <Body>
    为 <strong>{app.name}</strong>更新 {user.email}的角色.
  </Body>
  <Select
    placeholder={null}
    bind:value={selectedRole}
    on:change
    {options}
    label="Role"
    getOptionLabel={role => role.label}
    getOptionValue={role => role.value}
  />
</ModalContent>
