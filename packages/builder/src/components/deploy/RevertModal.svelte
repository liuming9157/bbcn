<script>
  import {
    Icon,
    Input,
    Modal,
    notifications,
    ModalContent,
  } from "@budibase/bbui"
  import { store } from "builderStore"
  import { API } from "api"

  let revertModal
  let appName

  $: appId = $store.appId

  const revert = async () => {
    try {
      await API.revertAppChanges(appId)

      // Reset frontend state after revert
      const applicationPkg = await API.fetchAppPackage(appId)
      await store.actions.initialise(applicationPkg)
      notifications.info("Changes reverted successfully")
    } catch (error) {
      notifications.error(`Error reverting changes: ${error}`)
    }
  }
</script>

<Icon name="Revert" hoverable on:click={revertModal.show} />
<Modal bind:this={revertModal}>
  <ModalContent
    title="撤销修改"
    confirmText="撤销"
    onConfirm={revert}
    disabled={appName !== $store.name}
  >
    <span
      >你的修改将会被删除，应用恢复到正式环境状态.</span
    >
    <span>输入你的应用名称以继续.</span>
    <Input bind:value={appName} />
  </ModalContent>
</Modal>
