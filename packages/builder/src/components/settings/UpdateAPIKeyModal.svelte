<script>
  import { ModalContent, Body, notifications } from "@budibase/bbui"
  import { auth } from "stores/portal"
  import { onMount } from "svelte"
  import CopyInput from "components/common/inputs/CopyInput.svelte"

  let apiKey = null

  async function generateAPIKey() {
    try {
      apiKey = await auth.generateAPIKey()
      notifications.success("新API key已生成")
    } catch (err) {
      notifications.error("Unable to generate new API key")
    }
    // need to return false to keep modal open
    return false
  }

  onMount(async () => {
    try {
      apiKey = await auth.fetchAPIKey()
    } catch (err) {
      notifications.error("Unable to fetch API key")
    }
  })
</script>

<ModalContent
  title="开发者信息"
  showConfirmButton={false}
  showSecondaryButton={true}
  secondaryButtonText="重新生成 key"
  secondaryAction={generateAPIKey}
>
  <Body size="S">
    你可以在这里看到你的开发者信息，例如API key.
  </Body>
  <CopyInput bind:value={apiKey} label="API key" />
</ModalContent>
