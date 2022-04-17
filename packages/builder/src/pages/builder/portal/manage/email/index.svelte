<script>
  import { goto } from "@roxi/routify"
  import {
    Button,
    Heading,
    Divider,
    Label,
    notifications,
    Layout,
    Input,
    Select,
    Body,
    Table,
    Checkbox,
  } from "@budibase/bbui"
  import { email } from "stores/portal"
  import { API } from "api"
  import { cloneDeep } from "lodash/fp"
  import analytics, { Events } from "analytics"

  const ConfigTypes = {
    SMTP: "smtp",
  }

  const templateSchema = {
    name: {
      displayName: "名称",
      editable: false,
    },
    category: {
      displayName: "分类",
      editable: false,
    },
  }

  $: emailInfo = getEmailInfo($email.definitions)

  let smtpConfig
  let loading
  let requireAuth = false

  function getEmailInfo(definitions) {
    if (!definitions) {
      return []
    }
    const entries = Object.entries(definitions.info)
    return entries.map(([key, value]) => ({ purpose: key, ...value }))
  }

  async function saveSmtp() {
    // clone it so we can remove stuff if required
    const smtp = cloneDeep(smtpConfig)
    if (!requireAuth) {
      delete smtp.config.auth
    }
    // Save your SMTP config
    try {
      const savedConfig = await API.saveConfig(smtp)
      smtpConfig._rev = savedConfig._rev
      smtpConfig._id = savedConfig._id
      notifications.success(`Settings saved`)
      analytics.captureEvent(Events.SMTP.SAVED)
    } catch (error) {
      notifications.error(
        `Failed to save email settings, reason: ${error?.message || "Unknown"}`
      )
    }
  }

  async function fetchSmtp() {
    loading = true
    try {
      // Fetch the configs for smtp
      const smtpDoc = await API.getConfig(ConfigTypes.SMTP)
      if (!smtpDoc._id) {
        smtpConfig = {
          type: ConfigTypes.SMTP,
          config: {
            secure: true,
          },
        }
      } else {
        smtpConfig = smtpDoc
      }
      loading = false
      requireAuth = smtpConfig.config.auth != null
      // Always attach the auth for the forms purpose -
      // this will be removed later if required
      if (!smtpDoc.config) {
        smtpDoc.config = {}
      }
      if (!smtpDoc.config.auth) {
        smtpConfig.config.auth = {
          type: "login",
        }
      }
    } catch (error) {
      notifications.error("Error fetching SMTP config")
    }
  }

  fetchSmtp()
</script>

<Layout noPadding>
  <Layout noPadding gap="XS">
    <Heading size="M">Email</Heading>
    <Body>
      发送邮件不是必须的，但是在找回密码过程等功能中强烈推荐使用。如果要设置自动的认证邮件，只需要添加下面的设置并点击激活按钮
    </Body>
  </Layout>
  <Divider />
  {#if smtpConfig}
    <Layout gap="XS" noPadding>
      <Heading size="S">SMTP</Heading>
      <Body size="S">添加SMTP信息</Body>
    </Layout>
    <Layout gap="XS" noPadding>
      <div class="form-row">
        <Label size="L">Host</Label>
        <Input bind:value={smtpConfig.config.host} />
      </div>
      <div class="form-row">
        <Label size="L">安全类型</Label>
        <Select
          bind:value={smtpConfig.config.secure}
          options={[
            { label: "SSL/TLS", value: true },
            { label: "None/STARTTLS", value: false },
          ]}
        />
      </div>
      <div class="form-row">
        <Label size="L">端口</Label>
        <Input type="number" bind:value={smtpConfig.config.port} />
      </div>
      <div class="form-row">
        <Label size="L">发送地址</Label>
        <Input type="email" bind:value={smtpConfig.config.from} />
      </div>
      <Checkbox bind:value={requireAuth} text="Require sign-in" />
      {#if requireAuth}
        <div class="form-row">
          <Label size="L">用户名</Label>
          <Input bind:value={smtpConfig.config.auth.user} />
        </div>
        <div class="form-row">
          <Label size="L">密码</Label>
          <Input type="password" bind:value={smtpConfig.config.auth.pass} />
        </div>
      {/if}
    </Layout>
    <div>
      <Button cta on:click={saveSmtp}>保存</Button>
    </div>
    <Divider />
    <Layout gap="XS" noPadding>
      <Heading size="S">模板</Heading>
      <Body size="S">
        BBCN已经设置好了邮件模板，用户开箱即用。请不要修改默认链接。
      </Body>
    </Layout>
    <Table
      data={emailInfo}
      schema={templateSchema}
      {loading}
      on:click={({ detail }) => $goto(`./${detail.purpose}`)}
      allowEditRows={false}
      allowSelectRows={false}
      allowEditColumns={false}
    />
  {/if}
</Layout>

<style>
  .form-row {
    display: grid;
    grid-template-columns: 120px 1fr;
    grid-gap: var(--spacing-l);
    align-items: center;
  }
</style>
