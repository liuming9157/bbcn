<script>
  import {
    Icon,
    Modal,
    notifications,
    ModalContent,
    Body,
    Button,
  } from "@budibase/bbui"
  import { store } from "builderStore"
  import { API } from "api"
  import clientPackage from "@budibase/client/package.json"

  let updateModal

  $: appId = $store.appId
  $: updateAvailable = clientPackage.version !== $store.version
  $: revertAvailable = $store.revertableVersion != null

  const refreshAppPackage = async () => {
    try {
      const pkg = await API.fetchAppPackage(appId)
      await store.actions.initialise(pkg)
    } catch (error) {
      notifications.error("Error fetching app package")
    }
  }

  const update = async () => {
    try {
      await API.updateAppClientVersion(appId)

      // Don't wait for the async refresh, since this causes modal flashing
      refreshAppPackage()
      notifications.success(
        `App updated successfully to version ${clientPackage.version}`
      )
    } catch (err) {
      notifications.error(`Error updating app: ${err}`)
    }
    updateModal.hide()
  }

  const revert = async () => {
    try {
      await API.revertAppClientVersion(appId)

      // Don't wait for the async refresh, since this causes modal flashing
      refreshAppPackage()
      notifications.success(
        `App reverted successfully to version ${$store.revertableVersion}`
      )
    } catch (err) {
      notifications.error(`Error reverting app: ${err}`)
    }
    updateModal.hide()
  }
</script>

<div class="icon-wrapper" class:highlight={updateAvailable}>
  <Icon name="Refresh" hoverable on:click={updateModal.show} />
</div>
<Modal bind:this={updateModal}>
  <ModalContent
    title="应用版本"
    confirmText="更新"
    cancelText={updateAvailable ? "取消" : "关闭"}
    onConfirm={update}
    showConfirmButton={updateAvailable}
  >
    <div slot="footer">
      {#if revertAvailable}
        <Button quiet secondary on:click={revert}>撤销</Button>
      {/if}
    </div>
    {#if updateAvailable}
      <Body size="S">
        当前应用版本是 <b>{$store.version}</b>, 新版本
        <b>{clientPackage.version}</b> 已发布. 更新版本可以获得更多功能、提升性能及bug修复.
      </Body>
    {:else}
      <Body size="S">
        当前版本号<b>{$store.version}</b> 已是最新版本.
      </Body>
    {/if}
    {#if revertAvailable}
      <Body size="S">
        如果你当前版本出现bug,你可以回滚到版本
        <b>{$store.revertableVersion}</b>
        
      </Body>
    {/if}
  </ModalContent>
</Modal>

<style>
  .icon-wrapper {
    display: contents;
  }
  .icon-wrapper.highlight :global(svg) {
    color: var(--spectrum-global-color-blue-600);
  }
</style>
