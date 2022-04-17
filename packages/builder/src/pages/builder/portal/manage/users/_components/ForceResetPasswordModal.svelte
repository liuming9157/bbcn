<script>
  import { createEventDispatcher } from "svelte"
  import { ModalContent, Body, Input, notifications } from "@budibase/bbui"
  import { users } from "stores/portal"

  const dispatch = createEventDispatcher()

  export let user

  const password = Math.random().toString(36).slice(2, 20)

  async function resetPassword() {
    try {
      await users.save({
        ...user,
        password,
        forceResetPassword: true,
      })
      notifications.success("Password reset successfully")
      dispatch("update")
    } catch (error) {
      notifications.error("Error resetting password")
    }
  }
</script>

<ModalContent
  onConfirm={resetPassword}
  size="M"
  title="强制重置密码"
  confirmText="重置密码"
  cancelText="取消"
  showCloseIcon={false}
>
  <Body noPadding
    >在重置密码之前，不要忘记复制新密码并告诉你的用户。出于安全考虑，一旦用户登陆，他们将会被要求修改密码</Body
  >
  <Input disabled label="密码" value={password} />
</ModalContent>
