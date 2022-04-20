<script>
  import { store } from "builderStore"
  import { tables } from "stores/backend"
  import {
    ModalContent,
    Body,
    Detail,
    Layout,
    Icon,
    ProgressCircle,
  } from "@budibase/bbui"
  import getTemplates from "builderStore/store/screenTemplates"

  export let onConfirm
  export let onCancel
  export let showProgressCircle = false

  const blankScreen = "createFromScratch"

  let selectedScreens = []
  let templates = getTemplates($store, $tables.list)

  $: blankSelected = selectedScreens?.length === 1
  $: autoSelected = selectedScreens?.length > 0 && !blankSelected

  const toggleScreenSelection = table => {
    if (selectedScreens.find(s => s.table === table.name)) {
      selectedScreens = selectedScreens.filter(
        screen => screen.table !== table.name
      )
    } else {
      let partialTemplates = getTemplates($store, $tables.list).filter(
        template => template.table === table.name
      )
      selectedScreens = [...partialTemplates, ...selectedScreens]
    }
  }

  const confirmScreenSelection = async () => {
    await onConfirm(selectedScreens)
  }
</script>

<div>
  <ModalContent
    title="添加screens"
    confirmText="添加 screens"
    cancelText="取消"
    onConfirm={confirmScreenSelection}
    {onCancel}
    disabled={!selectedScreens.length}
    size="L"
  >
    <Body size="S">
      选择你喜欢的screens添加到你的应用.
      使用CRUD功能自动生成screens.
    </Body>
    <Layout noPadding gap="S">
      <Detail size="S">空白screen</Detail>
      <div
        class="item"
        class:selected={selectedScreens.find(x => x.id.includes(blankScreen))}
        on:click={() =>
          toggleScreenSelection(templates.find(t => t.id === blankScreen))}
        class:disabled={autoSelected}
      >
        <div data-cy="blank-screen" class="content">
          <div class="text">空白</div>
        </div>
        <div
          style="color: var(--spectrum-global-color-green-600); float: right"
        >
          {#if selectedScreens.find(x => x.id === blankScreen)}
            <div class="checkmark-spacing">
              <Icon size="S" name="CheckmarkCircleOutline" />
            </div>
          {/if}
        </div>
      </div>
      {#if $tables.list.filter(table => table._id !== "ta_users").length > 0}
        <Detail size="S">自动生成 Screens</Detail>

        {#each $tables.list.filter(table => table._id !== "ta_users") as table}
          <div
            class:disabled={blankSelected}
            class:selected={selectedScreens.find(x => x.table === table.name)}
            on:click={() => toggleScreenSelection(table)}
            class="item"
          >
            <div class="content">
              <div class="text">{table.name}</div>
            </div>
            <div
              style="color: var(--spectrum-global-color-green-600); float: right"
            >
              {#if selectedScreens.find(x => x.table === table.name)}
                <div class="checkmark-spacing">
                  <Icon size="S" name="CheckmarkCircleOutline" />
                </div>
              {/if}
            </div>
          </div>
        {/each}
      {/if}
    </Layout>
    <div slot="footer">
      {#if showProgressCircle}
        <div class="footer-progress"><ProgressCircle size="S" /></div>
      {/if}
    </div>
  </ModalContent>
</div>

<style>
  .disabled {
    opacity: 0.3;
    pointer-events: none;
  }
  .checkmark-spacing {
    margin-right: var(--spacing-m);
  }

  .content {
    letter-spacing: 0px;
  }

  .footer-progress {
    margin-top: var(--spacing-s);
  }

  .text {
    font-weight: 600;
    margin-left: var(--spacing-m);
    font-size: 14px;
    text-transform: capitalize;
  }

  .item {
    cursor: pointer;
    grid-gap: var(--spectrum-alias-grid-margin-xsmall);
    padding: var(--spectrum-alias-item-padding-s);
    background: var(--spectrum-alias-background-color-primary);
    transition: 0.3s all;
    border: 1px solid var(--spectrum-global-color-gray-300);
    border-radius: 4px;
    box-sizing: border-box;
    border-width: 1px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 60px;
  }

  .item:hover,
  .selected {
    background: var(--spectrum-alias-background-color-tertiary);
  }
</style>
