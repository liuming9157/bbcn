<script>
  import { ModalContent, Body, Input, notifications } from "@budibase/bbui"
  import { writable } from "svelte/store"
  import { auth } from "stores/portal"

  const values = writable({
    firstName: $auth.user.firstName,
    lastName: $auth.user.lastName,
  })

  const updateInfo = async () => {
    try {
      await auth.updateSelf($values)
      notifications.success("信息修改成功")
    } catch (error) {
      notifications.error("Failed to update information")
    }
  }
</script>

<ModalContent
  title="修改用户信息"
  confirmText="修改信息"
  onConfirm={updateInfo}
>
  <Body size="S">
    在这里输入你的姓名.
  </Body>
  <Input disabled bind:value={$auth.user.email} label="Email" />
  <Input bind:value={$values.firstName} label="名" />
  <Input bind:value={$values.lastName} label="姓" />
</ModalContent>
