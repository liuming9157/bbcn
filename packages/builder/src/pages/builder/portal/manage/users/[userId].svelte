<script>
  import { goto } from "@roxi/routify"
  import {
    ActionButton,
    Button,
    Layout,
    Heading,
    Body,
    Divider,
    Label,
    Input,
    Select,
    Toggle,
    Modal,
    Table,
    ModalContent,
    notifications,
  } from "@budibase/bbui"
  import { fetchData } from "helpers"
  import { users, auth } from "stores/portal"

  import TagsRenderer from "./_components/RolesTagsTableRenderer.svelte"

  import UpdateRolesModal from "./_components/UpdateRolesModal.svelte"
  import ForceResetPasswordModal from "./_components/ForceResetPasswordModal.svelte"

  export let userId
  let deleteUserModal
  let editRolesModal
  let resetPasswordModal

  const roleSchema = {
    name: { displayName: "App" },
    role: {},
  }

  const noRoleSchema = {
    name: { displayName: "App" },
  }

  $: defaultRoleId = $userFetch?.data?.builder?.global ? "ADMIN" : ""
  // Merge the Apps list and the roles response to get something that makes sense for the table
  $: allAppList = Object.keys($apps?.data).map(id => {
    const roleId = $userFetch?.data?.roles?.[id] || defaultRoleId
    const role = $apps?.data?.[id].roles.find(role => role._id === roleId)
    return {
      ...$apps?.data?.[id],
      _id: id,
      role: [role],
    }
  })

  $: appList = allAppList.filter(app => !!app.role[0])
  $: noRoleAppList = allAppList
    .filter(app => !app.role[0])
    .map(app => {
      delete app.role
      return app
    })

  let selectedApp

  const userFetch = fetchData(`/api/global/users/${userId}`)
  const apps = fetchData(`/api/global/roles`)

  async function deleteUser() {
    try {
      await users.delete(userId)
      notifications.success(`User ${$userFetch?.data?.email} deleted.`)
      $goto("./")
    } catch (error) {
      notifications.error("Error deleting user")
    }
  }

  let toggleDisabled = false

  async function updateUserFirstName(evt) {
    try {
      await users.save({ ...$userFetch?.data, firstName: evt.target.value })
      await userFetch.refresh()
    } catch (error) {
      notifications.error("Error updating user")
    }
  }

  async function updateUserLastName(evt) {
    try {
      await users.save({ ...$userFetch?.data, lastName: evt.target.value })
      await userFetch.refresh()
    } catch (error) {
      notifications.error("Error updating user")
    }
  }

  async function toggleFlag(flagName, detail) {
    toggleDisabled = true
    try {
      await users.save({ ...$userFetch?.data, [flagName]: { global: detail } })
      await userFetch.refresh()
    } catch (error) {
      notifications.error("Error updating user")
    }
    toggleDisabled = false
  }

  async function toggleBuilderAccess({ detail }) {
    return toggleFlag("builder", detail)
  }

  async function toggleAdminAccess({ detail }) {
    return toggleFlag("admin", detail)
  }

  async function openUpdateRolesModal({ detail }) {
    selectedApp = detail
    editRolesModal.show()
  }
</script>

<Layout noPadding>
  <Layout gap="XS" noPadding>
    <div>
      <ActionButton
        on:click={() => $goto("./")}
        quiet
        size="S"
        icon="BackAndroid"
      >
        返回用户管理
      </ActionButton>
    </div>
    <Heading>用户: {$userFetch?.data?.email}</Heading>
    <Body>修改用户信息和角色，删除用户，强制重置密码</Body>
  </Layout>
  <Divider size="S" />
  <Layout gap="S" noPadding>
    <Heading size="S">普通设置</Heading>
    <div class="fields">
      <div class="field">
        <Label size="L">Email</Label>
        <Input disabled thin value={$userFetch?.data?.email} />
      </div>
      <div class="field">
        <Label size="L">分组</Label>
        <Select disabled options={["All users"]} value="All users" />
      </div>
      <div class="field">
        <Label size="L">名</Label>
        <Input
          thin
          value={$userFetch?.data?.firstName}
          on:blur={updateUserFirstName}
        />
      </div>
      <div class="field">
        <Label size="L">姓</Label>
        <Input
          thin
          value={$userFetch?.data?.lastName}
          on:blur={updateUserLastName}
        />
      </div>
      <!-- don't let a user remove the privileges that let them be here -->
      {#if userId !== $auth.user._id}
        <div class="field">
          <Label size="L">开发权限</Label>
          <Toggle
            text=""
            value={$userFetch?.data?.builder?.global}
            on:change={toggleBuilderAccess}
            disabled={toggleDisabled}
          />
        </div>
        <div class="field">
          <Label size="L">管理权限</Label>
          <Toggle
            text=""
            value={$userFetch?.data?.admin?.global}
            on:change={toggleAdminAccess}
            disabled={toggleDisabled}
          />
        </div>
      {/if}
    </div>
    <div class="regenerate">
      <ActionButton
        size="S"
        icon="Refresh"
        quiet
        on:click={resetPasswordModal.show}>强制重置密码</ActionButton
      >
    </div>
  </Layout>
  <Divider size="S" />
  <Layout gap="S" noPadding>
    <Heading size="S">配置用户角色</Heading>
    <Body>指定角色并授权.</Body>
    <Table
      on:click={openUpdateRolesModal}
      schema={roleSchema}
      data={appList}
      allowEditColumns={false}
      allowEditRows={false}
      allowSelectRows={false}
      customRenderers={[{ column: "role", component: TagsRenderer }]}
    />
  </Layout>
  <Layout gap="S" noPadding>
    <Heading size="XS">没有权限</Heading>
    <Body>该页面不显示应用列表</Body>
    <Table
      on:click={openUpdateRolesModal}
      schema={noRoleSchema}
      data={noRoleAppList}
      allowEditColumns={false}
      allowEditRows={false}
      allowSelectRows={false}
    />
  </Layout>
  <Divider size="S" />
  <Layout gap="XS" noPadding>
    <Heading size="S">删除用户</Heading>
    <Body>从你的账户中彻底删除某个用户</Body>
  </Layout>
  <div class="delete-button">
    <Button warning on:click={deleteUserModal.show}>删除用户</Button>
  </div>
</Layout>

<Modal bind:this={deleteUserModal}>
  <ModalContent
    warning
    onConfirm={deleteUser}
    title="Delete User"
    confirmText="Delete user"
    cancelText="Cancel"
    showCloseIcon={false}
  >
    <Body>
      确定要删除 <strong>{$userFetch?.data?.email}</strong>
    </Body>
  </ModalContent>
</Modal>
<Modal bind:this={editRolesModal}>
  <UpdateRolesModal
    app={selectedApp}
    user={$userFetch.data}
    on:update={userFetch.refresh}
  />
</Modal>
<Modal bind:this={resetPasswordModal}>
  <ForceResetPasswordModal
    user={$userFetch.data}
    on:update={userFetch.refresh}
  />
</Modal>

<style>
  .fields {
    display: grid;
    grid-gap: var(--spacing-m);
  }
  .field {
    display: grid;
    grid-template-columns: 32% 1fr;
    align-items: center;
  }
  .regenerate {
    position: absolute;
    top: 0;
    right: 0;
  }
</style>
