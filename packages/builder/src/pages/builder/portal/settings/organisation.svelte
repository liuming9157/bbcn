<script>
  import {
    Layout,
    Heading,
    Body,
    Button,
    Divider,
    Label,
    Input,
    Dropzone,
    notifications,
  } from "@budibase/bbui"
  import { auth, organisation, admin } from "stores/portal"
  import { API } from "api"
  import { writable } from "svelte/store"
  import { redirect } from "@roxi/routify"

  // Only admins allowed here
  $: {
    if (!$auth.isAdmin) {
      $redirect("../../portal")
    }
  }

  const values = writable({
    company: $organisation.company,
    platformUrl: $organisation.platformUrl,
    logo: $organisation.logoUrl
      ? { url: $organisation.logoUrl, type: "image", name: "Logo" }
      : null,
  })
  let loading = false

  async function uploadLogo(file) {
    try {
      let data = new FormData()
      data.append("file", file)
      await API.uploadLogo(data)
    } catch (error) {
      notifications.error("Error uploading logo")
    }
  }

  async function saveConfig() {
    loading = true

    try {
      // Upload logo if required
      if ($values.logo && !$values.logo.url) {
        await uploadLogo($values.logo)
        await organisation.init()
      }

      const config = {
        company: $values.company ?? "",
        platformUrl: $values.platformUrl ?? "",
      }

      // Remove logo if required
      if (!$values.logo) {
        config.logoUrl = ""
      }

      // Update settings
      await organisation.save(config)
    } catch (error) {
      notifications.error("Error saving org config")
    }
    loading = false
  }
</script>

{#if $auth.isAdmin}
  <Layout noPadding>
    <Layout gap="XS" noPadding>
      <Heading size="M">Organisation</Heading>
      <Body>
        Organisation settings is where you can edit your organisation name and
        logo. You can also configure your platform URL and enable or disable
        analytics.在组织设置里，你可以修改组织名称和logo.你可以配置平台URL并且启用/暂停分析。
      </Body>
    </Layout>
    <Divider size="S" />
    <Layout gap="XS" noPadding>
      <Heading size="S">信息</Heading>
      <Body size="S">在这里修改组织名称和Logo.</Body>
    </Layout>
    <div class="fields">
      <div class="field">
        <Label size="L">组织名称</Label>
        <Input thin bind:value={$values.company} />
      </div>
      <div class="field logo">
        <Label size="L">Logo</Label>
        <div class="file">
          <Dropzone
            value={[$values.logo]}
            on:change={e => {
              if (!e.detail || e.detail.length === 0) {
                $values.logo = null
              } else {
                $values.logo = e.detail[0]
              }
            }}
          />
        </div>
      </div>
    </div>
    {#if !$admin.cloud}
      <Divider size="S" />
      <Layout gap="XS" noPadding>
        <Heading size="S">平台</Heading>
        <Body size="S">在这里设置平台信息.</Body>
      </Layout>
      <div class="fields">
        <div class="field">
          <Label
            size="L"
            tooltip={"Update the Platform URL to match your Budibase web URL. This keeps email templates and authentication configs up to date."}
            >平台URL</Label
          >
          <Input thin bind:value={$values.platformUrl} />
        </div>
      </div>
    {/if}
    <div>
      <Button disabled={loading} on:click={saveConfig} cta>保存</Button>
    </div>
  </Layout>
{/if}

<style>
  .fields {
    display: grid;
    grid-gap: var(--spacing-m);
  }
  .field {
    display: grid;
    grid-template-columns: 100px 1fr;
    grid-gap: var(--spacing-l);
    align-items: center;
  }
  .file {
    max-width: 30ch;
  }
  .logo {
    align-items: start;
  }
</style>
