<script>
  import {
    Body,
    Input,
    Select,
    ModalContent,
    notifications,
    Toggle,
    Label,
  } from "@budibase/bbui"
  import { createValidationStore, emailValidator } from "helpers/validation"
  import { users } from "stores/portal"
  import analytics, { Events } from "analytics"

  export let disabled

  const options = ["Email onboarding", "Basic onboarding"]
  let selected = options[0]
  let builder, admin

  const [email, error, touched] = createValidationStore("", emailValidator)

  async function createUserFlow() {
    try {
      const res = await users.invite({ email: $email, builder, admin })
      notifications.success(res.message)
      analytics.captureEvent(Events.USER.INVITE, { type: selected })
    } catch (error) {
      notifications.error("Error inviting user")
    }
  }
</script>

<ModalContent
  onConfirm={createUserFlow}
  size="M"
  title="添加新用户"
  confirmText="添加用户"
  confirmDisabled={disabled}
  cancelText="Cancel"
  disabled={$error}
  showCloseIcon={false}
>
  <Body size="S">
    如果你已经进行过邮件配置，你可以使用邮件注册流程。否则，请使用最基础的密码登陆流程。
  </Body>
  <Select
    placeholder={null}
    bind:value={selected}
    on:change
    {options}
    label="通过以下方式添加新用户:"
  />
  <Input
    type="email"
    bind:value={$email}
    error={$touched && $error}
    placeholder="jack@163.com"
    label="Email"
  />
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
