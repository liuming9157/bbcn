<script>
  import { ModalContent, Body, notifications } from "@budibase/bbui"
  import PasswordRepeatInput from "components/common/users/PasswordRepeatInput.svelte"
  import { auth } from "stores/portal"

  let password
  let error

  const updatePassword = async () => {
    try {
      await auth.updateSelf({ password })
      notifications.success("密码修改成功")
    } catch (error) {
      notifications.error("Failed to update password")
    }
  }
</script>

<ModalContent
  title="修改密码"
  confirmText="修改密码"
  onConfirm={updatePassword}
  disabled={error || !password}
>
  <Body size="S">输入你的密码.</Body>
  <PasswordRepeatInput bind:password bind:error />
</ModalContent>
