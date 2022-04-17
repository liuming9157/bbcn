<script>
  import { Layout, Heading, Body, Divider, Label, Select } from "@budibase/bbui"
  import { themeStore } from "builderStore"
  import { capitalise } from "helpers"
</script>

<Layout noPadding>
  <Layout gap="XS" noPadding>
    <Heading size="M">主题</Heading>
    <Body>修改主题可以自定义界面样式.</Body>
  </Layout>
  <Divider size="S" />
  <div class="fields">
    <div class="field">
      <Label size="L">主题</Label>
      <Select
        options={$themeStore.options}
        bind:value={$themeStore.theme}
        placeholder={null}
        getOptionLabel={capitalise}
      />
    </div>
  </div>
</Layout>

<style>
  .fields {
    display: grid;
    grid-gap: var(--spacing-m);
  }
  .field {
    display: grid;
    grid-template-columns: 120px 1fr;
    align-items: center;
  }
</style>
