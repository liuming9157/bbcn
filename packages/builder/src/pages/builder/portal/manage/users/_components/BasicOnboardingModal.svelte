<script>
  import {
    ModalContent,
    Body,
    Input,
    notifications,
    Toggle,
    Label,
  } from "@budibase/bbui"
  import { createValidationStore, emailValidator } from "helpers/validation"
  import { users } from "stores/portal"

  const [email, error, touched] = createValidationStore("", emailValidator)
  const password = Math.random().toString(36).slice(2, 20)
  let builder = false,
    admin = false

  async function createUser() {
    try {
      await users.create({
        email: $email,
        password,
        builder,
        admin,
        forceResetPassword: true,
      })
      notifications.success("添加用户成功")
    } catch (error) {
      notifications.error("Error creating user")
    }
  }
</script>

<ModalContent
  onConfirm={createUser}
  size="M"
  title="基础用户登陆"
  confirmText="继续"
  cancelText="取消"
  disabled={$error}
  error={$touched && $error}
  showCloseIcon={false}
>
  <Body size="S">接下来你会发现用户名和密码，记得要保存。</Body>
  <Input
    type="email"
    label="用户名"
    bind:value={$email}
    error={$touched && $error}
  />
  <Input disabled label="密码" value={password} />
  <div>
    <div class="toggle">
      <Label size="L">开发权限</Label>
      <Toggle text="" bind:value={builder} />
    </div>
    <div class="toggle">
      <Label size="L">管理权限</Label>
      <Toggle text="" bind:value={admin} />
    </div>
  </div>
</ModalContent>

<style>
  .toggle {
    display: grid;
    grid-template-columns: 78% 1fr;
    align-items: center;
    width: 50%;
  }
</style>
