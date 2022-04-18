<script>
  import {
    Heading,
    Button,
    Icon,
    ActionMenu,
    MenuItem,
    StatusLight,
  } from "@budibase/bbui"
  import { processStringSync } from "@budibase/string-templates"

  export let app
  export let exportApp
  export let viewApp
  export let editApp
  export let updateApp
  export let deleteApp
  export let unpublishApp
  export let releaseLock
  export let editIcon
</script>

<div class="title">
  <div style="display: flex;">
    <div style="color: {app.icon?.color || ''}">
      <Icon size="XL" name={app.icon?.name || "Apps"} />
    </div>
    <div class="name" on:click={() => editApp(app)}>
      <Heading size="XS">
        {app.name}
      </Heading>
    </div>
  </div>
</div>
<div class="desktop">
  {#if app.updatedAt}
    {processStringSync("Updated {{ duration time 'millisecond' }} ago", {
      time: new Date().getTime() - new Date(app.updatedAt).getTime(),
    })}
  {:else}
    永不更新
  {/if}
</div>
<div class="desktop">
  <StatusLight
    positive={!app.lockedYou && !app.lockedOther}
    notice={app.lockedYou}
    negative={app.lockedOther}
  >
    {#if app.lockedYou}
      已被你锁定
    {:else if app.lockedOther}
      已被{app.lockedBy.email}锁定
    {:else}
      开放
    {/if}
  </StatusLight>
</div>
<div class="desktop">
  <StatusLight active={app.deployed} neutral={!app.deployed}>
    {#if app.deployed}Published{:else}Unpublished{/if}
  </StatusLight>
</div>
<div data-cy={`row_actions_${app.appId}`}>
  <Button
    size="S"
    disabled={app.lockedOther}
    on:click={() => editApp(app)}
    secondary
  >
    开放
  </Button>
  <ActionMenu align="right">
    <Icon hoverable slot="control" name="More" />
    {#if app.deployed}
      <MenuItem on:click={() => viewApp(app)} icon="GlobeOutline">
        查看已发布应用
      </MenuItem>
    {/if}
    {#if app.lockedYou}
      <MenuItem on:click={() => releaseLock(app)} icon="LockOpen">
        锁定发布
      </MenuItem>
    {/if}
    <MenuItem on:click={() => exportApp(app)} icon="Download">Export</MenuItem>
    {#if app.deployed}
      <MenuItem on:click={() => unpublishApp(app)} icon="GlobeRemove">
        取消发布
      </MenuItem>
    {/if}
    {#if !app.deployed}
      <MenuItem on:click={() => updateApp(app)} icon="Edit">修改</MenuItem>
      <MenuItem on:click={() => deleteApp(app)} icon="Delete">删除</MenuItem>
    {/if}
    <MenuItem on:click={() => editIcon(app)} icon="Brush">修改图标</MenuItem>
  </ActionMenu>
</div>

<style>
  .name {
    text-decoration: none;
    overflow: hidden;
  }
  .name :global(.spectrum-Heading) {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    margin-left: calc(1.5 * var(--spacing-xl));
  }
  .title :global(h1:hover) {
    color: var(--spectrum-global-color-blue-600);
    cursor: pointer;
    transition: color 130ms ease;
  }

  @media (max-width: 640px) {
    .desktop {
      display: none !important;
    }
  }
</style>
