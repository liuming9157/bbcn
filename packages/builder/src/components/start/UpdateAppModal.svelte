<script>
  import { writable, get as svelteGet } from "svelte/store"
  import { notifications, Input, ModalContent, Body } from "@budibase/bbui"
  import { apps } from "stores/portal"
  import { onMount } from "svelte"
  import { createValidationStore } from "helpers/validation/yup"
  import * as appValidation from "helpers/validation/yup/app"

  export let app

  const values = writable({ name: "", url: null })
  const validation = createValidationStore()
  $: validation.check($values)

  onMount(async () => {
    $values.name = app.name
    $values.url = app.url
    setupValidation()
  })

  const setupValidation = async () => {
    const applications = svelteGet(apps)
    appValidation.name(validation, { apps: applications, currentApp: app })
    appValidation.url(validation, { apps: applications, currentApp: app })
    // init validation
    validation.check($values)
  }

  async function updateApp() {
    try {
      // Update App
      const body = {
        name: $values.name.trim(),
      }
      if ($values.url) {
        body.url = $values.url.trim()
      }
      await apps.update(app.instance._id, body)
    } catch (error) {
      console.error(error)
      notifications.error("Error updating app")
    }
  }

  const resolveAppUrl = (template, name) => {
    let parsedName
    const resolvedName = resolveAppName(null, name)
    parsedName = resolvedName ? resolvedName.toLowerCase() : ""
    const parsedUrl = parsedName ? parsedName.replace(/\s+/g, "-") : ""
    return encodeURI(parsedUrl)
  }

  const resolveAppName = (template, name) => {
    if (template && !name) {
      return template.name
    }
    return name ? name.trim() : null
  }

  const tidyUrl = url => {
    if (url && !url.startsWith("/")) {
      url = `/${url}`
    }
    $values.url = url === "" ? null : url
  }

  const nameToUrl = appName => {
    let resolvedUrl = resolveAppUrl(null, appName)
    tidyUrl(resolvedUrl)
  }
</script>

<ModalContent
  title={"修改应用"}
  confirmText={"保存"}
  onConfirm={updateApp}
  disabled={!$validation.valid}
>
  <Body size="S">修改应用名称.</Body>
  <Input
    bind:value={$values.name}
    error={$validation.touched.name && $validation.errors.name}
    on:blur={() => ($validation.touched.name = true)}
    on:change={nameToUrl($values.name)}
    label="名称"
  />
  <Input
    bind:value={$values.url}
    error={$validation.touched.url && $validation.errors.url}
    on:blur={() => ($validation.touched.url = true)}
    on:change={tidyUrl($values.url)}
    label="URL"
    placeholder={$values.url
      ? $values.url
      : `/${resolveAppUrl(null, $values.name)}`}
  />
</ModalContent>
