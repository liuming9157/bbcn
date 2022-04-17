<script>
  import { Layout, Heading, Body, Button, notifications } from "@budibase/bbui"
  import { goto, params } from "@roxi/routify"
  import { users } from "stores/portal"
  import PasswordRepeatInput from "components/common/users/PasswordRepeatInput.svelte"
  import Logo from "assets/bb-emblem.svg"

  const inviteCode = $params["?code"]
  let password, error

  async function acceptInvite() {
    try {
      await users.acceptInvite(inviteCode, password)
      notifications.success("Invitation accepted successfully")
      $goto("../auth/login")
    } catch (error) {
      notifications.error("Error accepting invitation")
    }
  }
</script>

<section>
  <div class="container">
    <Layout>
      <img src={Logo} alt="logo" />
      <Layout gap="XS" justifyItems="center" noPadding>
        <Heading size="M">接受邀请</Heading>
        <Body textAlign="center" size="M">输入密码创建用户.</Body>
      </Layout>
      <PasswordRepeatInput bind:error bind:password />
      <Button disabled={error} cta on:click={acceptInvite}>接受邀请</Button>
    </Layout>
  </div>
</section>

<style>
  section {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
  .container {
    margin: 0 auto;
    width: 260px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
  }
  img {
    width: 40px;
    margin: 0 auto;
  }
</style>
