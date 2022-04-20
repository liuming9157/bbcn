<script>
  import { Modal, ActionButton } from "@budibase/bbui"
  import CreateViewModal from "../modals/CreateViewModal.svelte"

  let modal
</script>

<ActionButton icon="CollectionAdd" size="S" quiet on:click={modal.show}>
  创建视图
</ActionButton>
<Modal bind:this={modal}>
  <CreateViewModal />
</Modal>
