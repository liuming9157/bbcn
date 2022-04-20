<script>
  import { createEventDispatcher } from "svelte"
  import { Button } from "@budibase/bbui"
  import ConfirmDialog from "components/common/ConfirmDialog.svelte"

  export let selectedRows
  export let deleteRows

  const dispatch = createEventDispatcher()
  let modal

  async function confirmDeletion() {
    await deleteRows()
    modal?.hide()
    dispatch("updaterows")
  }
</script>

<Button icon="Delete" size="s" primary quiet on:click={modal.show}>
  删除
  {selectedRows.length}
  行
</Button>
<ConfirmDialog
  bind:this={modal}
  okText="删除"
  onOk={confirmDeletion}
  title="确认删除"
>
  确定删除
  {selectedRows.length}
  行?
</ConfirmDialog>
