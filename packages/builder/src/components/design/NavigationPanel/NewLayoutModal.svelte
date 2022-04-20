<script>
  import { notifications } from "@budibase/bbui"
  import { store } from "builderStore"
  import { Input, ModalContent } from "@budibase/bbui"

  let name = ""

  async function save() {
    try {
      await store.actions.layouts.save({ name })
      notifications.success(`布局 ${name}创建成功`)
    } catch (error) {
      notifications.error("Error creating layout")
    }
  }
</script>

<ModalContent title="创建布局" confirmText="创建" onConfirm={save}>
  <Input thin label="名称" bind:value={name} />
</ModalContent>
