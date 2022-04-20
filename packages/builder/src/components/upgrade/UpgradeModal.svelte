<script>
  import { Modal, ModalContent, Button } from "@budibase/bbui"
  import { admin } from "stores/portal"

  let upgradeModal

  const onConfirm = () => {
    window.open(`${$admin.accountPortalUrl}/portal/install`, "_blank")
  }
</script>

<div>
  <Button
    on:click={upgradeModal.show}
    quiet
    primary
    size="M"
    icon="DownloadFromCloud">自托管Budibase</Button
  >
</div>
<Modal bind:this={upgradeModal}>
  <ModalContent
    size="M"
    {onConfirm}
    title="自托管Budibase"
    confirmText="自托管Budibase"
  >
    <span>
      仅需要几分钟即可完成自托管，完全免费且可以创建无限数量的应用，!
    </span>
  </ModalContent>
</Modal>
