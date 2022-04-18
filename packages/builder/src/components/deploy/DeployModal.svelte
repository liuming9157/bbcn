<script>
  import { Button, Modal, notifications, ModalContent } from "@budibase/bbui"
  import { API } from "api"
  import analytics, { Events } from "analytics"
  import { store } from "builderStore"

  let feedbackModal
  let publishModal

  async function deployApp() {
    try {
      await API.deployAppChanges()
      analytics.captureEvent(Events.APP.PUBLISHED, {
        appId: $store.appId,
      })
      notifications.success("Application published successfully")
    } catch (error) {
      analytics.captureException(error)
      notifications.error("Error publishing app")
    }
  }
</script>

<Button secondary on:click={publishModal.show}>发布</Button>
<Modal bind:this={feedbackModal}>
  <ModalContent
    title="喜欢BBCN吗?"
    size="L"
    showConfirmButton={false}
    showCancelButton={false}
  />
</Modal>
<Modal bind:this={publishModal}>
  <ModalContent
    title="发布到正式环境"
    confirmText="发布"
    onConfirm={deployApp}
  >
    <span
      >你的修改将会发布到应用正式环境。</span
    >
  </ModalContent>
</Modal>
