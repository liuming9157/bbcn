<script>
  import { ActionButton, Modal } from "@budibase/bbui"
  import CreateEditColumn from "../modals/CreateEditColumn.svelte"

  let modal
</script>

<ActionButton icon="TableColumnAddRight" quiet size="S" on:click={modal.show}>
  创建列
</ActionButton>
<Modal bind:this={modal}>
  <CreateEditColumn on:updatecolumns />
</Modal>
