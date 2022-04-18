<script>
  import {
    Heading,
    Layout,
    Detail,
    Button,
    Input,
    Select,
    Modal,
    Page,
    notifications,
    Body,
    Search,
    Divider,
  } from "@budibase/bbui"
  import TemplateDisplay from "components/common/TemplateDisplay.svelte"
  import Spinner from "components/common/Spinner.svelte"
  import CreateAppModal from "components/start/CreateAppModal.svelte"
  import UpdateAppModal from "components/start/UpdateAppModal.svelte"
  import ChooseIconModal from "components/start/ChooseIconModal.svelte"

  import { store, automationStore } from "builderStore"
  import { API } from "api"
  import { onMount } from "svelte"
  import { apps, auth, admin, templates } from "stores/portal"
  import download from "downloadjs"
  import { goto } from "@roxi/routify"
  import ConfirmDialog from "components/common/ConfirmDialog.svelte"
  import AppRow from "components/start/AppRow.svelte"
  import { AppStatus } from "constants"
  import analytics, { Events } from "analytics"
  import Logo from "assets/bb-space-man.svg"

  let sortBy = "name"
  let template
  let selectedApp
  let creationModal
  let updatingModal
  let deletionModal
  let unpublishModal
  let iconModal
  let creatingApp = false
  let loaded = false
  let searchTerm = ""
  let cloud = $admin.cloud
  let appName = ""
  let creatingFromTemplate = false

  const resolveWelcomeMessage = (auth, apps) => {
    const userWelcome = auth?.user?.firstName
      ? `欢迎 ${auth?.user?.firstName}!`
      : "欢迎回来!"
    return apps?.length ? userWelcome : "开始创建你的第一个应用吧!"
  }
  $: welcomeHeader = resolveWelcomeMessage($auth, $apps)
  $: welcomeBody = $apps?.length
    ? "管理你的应用并使用模板创建"
    : "从0开始或使用模板创建应用"

  $: createAppButtonText = $apps?.length ? "创建新应用" : "从0开始"

  $: enrichedApps = enrichApps($apps, $auth.user, sortBy)
  $: filteredApps = enrichedApps.filter(app =>
    app?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const enrichApps = (apps, user, sortBy) => {
    const enrichedApps = apps.map(app => ({
      ...app,
      deployed: app.status === AppStatus.DEPLOYED,
      lockedYou: app.lockedBy && app.lockedBy.email === user?.email,
      lockedOther: app.lockedBy && app.lockedBy.email !== user?.email,
    }))

    if (sortBy === "status") {
      return enrichedApps.sort((a, b) => {
        if (a.status === b.status) {
          return a.name?.toLowerCase() < b.name?.toLowerCase() ? -1 : 1
        }
        return a.status === AppStatus.DEPLOYED ? -1 : 1
      })
    } else if (sortBy === "updated") {
      return enrichedApps.sort((a, b) => {
        const aUpdated = a.updatedAt || "9999"
        const bUpdated = b.updatedAt || "9999"
        return aUpdated < bUpdated ? 1 : -1
      })
    } else {
      return enrichedApps.sort((a, b) => {
        return a.name?.toLowerCase() < b.name?.toLowerCase() ? -1 : 1
      })
    }
  }

  const initiateAppCreation = () => {
    if ($apps?.length) {
      $goto("/builder/portal/apps/create")
    } else {
      template = null
      creationModal.show()
      creatingApp = true
    }
  }

  const initiateAppsExport = () => {
    try {
      download(`/api/cloud/export`)
      notifications.success("Apps exported successfully")
    } catch (err) {
      notifications.error(`Error exporting apps: ${err}`)
    }
  }

  const initiateAppImport = () => {
    template = { fromFile: true }
    creationModal.show()
    creatingApp = true
  }

  const autoCreateApp = async () => {
    try {
      // Auto name app if has same name
      let appName = template.key
      const appsWithSameName = $apps.filter(app =>
        app.name?.startsWith(appName)
      )
      appName = `${appName}-${appsWithSameName.length + 1}`

      // Create form data to create app
      let data = new FormData()
      data.append("name", appName)
      data.append("useTemplate", true)
      data.append("templateKey", template.key)

      // Create App
      const createdApp = await API.createApp(data)
      analytics.captureEvent(Events.APP.CREATED, {
        name: appName,
        appId: createdApp.instance._id,
        template,
        fromTemplateMarketplace: true,
      })

      // Select Correct Application/DB in prep for creating user
      const pkg = await API.fetchAppPackage(createdApp.instance._id)
      await store.actions.initialise(pkg)
      await automationStore.actions.fetch()
      // Update checklist - in case first app
      await admin.init()

      // Create user
      await API.updateOwnMetadata({
        roleId: "BASIC",
      })
      await auth.setInitInfo({})
      $goto(`/builder/app/${createdApp.instance._id}`)
    } catch (error) {
      notifications.error("Error creating app")
    }
  }

  const stopAppCreation = () => {
    template = null
    creatingApp = false
  }

  const viewApp = app => {
    if (app.url) {
      window.open(`/app${app.url}`)
    } else {
      window.open(`/${app.prodId}`)
    }
  }

  const editApp = app => {
    if (app.lockedOther) {
      notifications.error(
        `App locked by ${app.lockedBy.email}. Please allow lock to expire or have them unlock this app.`
      )
      return
    }
    $goto(`../../app/${app.devId}`)
  }

  const editIcon = app => {
    selectedApp = app
    iconModal.show()
  }

  const exportApp = app => {
    const id = app.deployed ? app.prodId : app.devId
    const appName = encodeURIComponent(app.name)
    window.location = `/api/backups/export?appId=${id}&appname=${appName}`
  }

  const unpublishApp = app => {
    selectedApp = app
    unpublishModal.show()
  }

  const confirmUnpublishApp = async () => {
    if (!selectedApp) {
      return
    }
    try {
      await API.unpublishApp(selectedApp.prodId)
      await apps.load()
      notifications.success("取消发布成功")
    } catch (err) {
      notifications.error("Error unpublishing app")
    }
  }

  const deleteApp = app => {
    selectedApp = app
    deletionModal.show()
  }

  const confirmDeleteApp = async () => {
    if (!selectedApp) {
      return
    }
    try {
      await API.deleteApp(selectedApp?.devId)
      await apps.load()
      // Get checklist, just in case that was the last app
      await admin.init()
      notifications.success("删除应用成功")
    } catch (err) {
      notifications.error("Error deleting app")
    }
    selectedApp = null
    appName = null
  }

  const updateApp = async app => {
    selectedApp = app
    updatingModal.show()
  }

  const releaseLock = async app => {
    try {
      await API.releaseAppLock(app.devId)
      await apps.load()
      notifications.success("锁定发布成功")
    } catch (err) {
      notifications.error("Error releasing lock")
    }
  }

  function createAppFromTemplateUrl(templateKey) {
    // validate the template key just to make sure
    const templateParts = templateKey.split("/")
    if (templateParts.length === 2 && templateParts[0] === "app") {
      template = {
        key: templateKey,
      }
      autoCreateApp()
    } else {
      notifications.error("Your Template URL is invalid. Please try another.")
    }
  }

  onMount(async () => {
    try {
      await apps.load()
      await templates.load()
      if ($templates?.length === 0) {
        notifications.error(
          "There was a problem loading quick start templates."
        )
      }
      // If the portal is loaded from an external URL with a template param
      const initInfo = await auth.getInitInfo()
      if (initInfo?.init_template) {
        creatingFromTemplate = true
        createAppFromTemplateUrl(initInfo.init_template)
        return
      }
    } catch (error) {
      notifications.error("Error loading apps and templates")
    }
    loaded = true
  })
</script>

<Page wide>
  <Layout noPadding gap="XL">
    {#if loaded}
      <div class="title">
        <div class="welcome">
          <Layout noPadding gap="XS">
            <Heading size="M">{welcomeHeader}</Heading>
            <Body size="S">
              {welcomeBody}
            </Body>
          </Layout>

          <div class="buttons">
            <Button
              dataCy="create-app-btn"
              size="L"
              icon="Add"
              cta
              on:click={initiateAppCreation}
            >
              {createAppButtonText}
            </Button>
            {#if $apps?.length > 0}
              <Button
                icon="Experience"
                size="L"
                quiet
                secondary
                on:click={$goto("/builder/portal/apps/templates")}
              >
                模板
              </Button>
            {/if}
            {#if !$apps?.length}
              <Button
                dataCy="import-app-btn"
                icon="Import"
                size="L"
                quiet
                secondary
                on:click={initiateAppImport}
              >
                Import app
              </Button>
            {/if}
          </div>
        </div>
        <div>
          <Layout gap="S" justifyItems="center">
            <img class="img-logo img-size" alt="logo" src={Logo} />
          </Layout>
        </div>
        <Divider size="S" />
      </div>

      {#if !$apps?.length && $templates?.length}
        <TemplateDisplay templates={$templates} />
      {/if}

      {#if enrichedApps.length}
        <Layout noPadding gap="S">
          <div class="title">
            <Detail size="L">我的应用</Detail>
            {#if enrichedApps.length > 1}
              <div class="app-actions">
                {#if cloud}
                  <Button
                    size="M"
                    icon="Export"
                    quiet
                    secondary
                    on:click={initiateAppsExport}
                  >
                    导出应用
                  </Button>
                {/if}
                <div class="filter">
                  <Select
                    quiet
                    autoWidth
                    bind:value={sortBy}
                    placeholder={null}
                    options={[
                      { label: "按照名称", value: "name" },
                      { label: "按照更新时间", value: "updated" },
                      { label: "按照状态", value: "status" },
                    ]}
                  />
                  <Search placeholder="搜索" bind:value={searchTerm} />
                </div>
              </div>
            {/if}
          </div>

          <div class="appTable">
            {#each filteredApps as app (app.appId)}
              <AppRow
                {releaseLock}
                {editIcon}
                {app}
                {unpublishApp}
                {viewApp}
                {editApp}
                {exportApp}
                {deleteApp}
                {updateApp}
              />
            {/each}
          </div>
        </Layout>
      {/if}
    {/if}

    {#if creatingFromTemplate}
      <div class="empty-wrapper">
        <img class="img-logo img-size" alt="logo" src={Logo} />
        <p>使用选中模板创建你的BBCN模板</p>
        <Spinner size="10" />
      </div>
    {/if}
  </Layout>
</Page>

<Modal
  bind:this={creationModal}
  padding={false}
  width="600px"
  on:hide={stopAppCreation}
>
  <CreateAppModal {template} />
</Modal>

<Modal bind:this={updatingModal} padding={false} width="600px">
  <UpdateAppModal app={selectedApp} />
</Modal>

<ConfirmDialog
  bind:this={deletionModal}
  title="确认删除"
  okText="删除应用"
  onOk={confirmDeleteApp}
  onCancel={() => (appName = null)}
  disabled={appName !== selectedApp?.name}
>
  危险操作。确定要删除 <b>{selectedApp?.name}</b>?

  <p>请再次输入应用名称以确认</p>
  <Input
    bind:value={appName}
    data-cy="delete-app-confirmation"
    placeholder={selectedApp?.name}
  />
</ConfirmDialog>
<ConfirmDialog
  bind:this={unpublishModal}
  title="确认取消发布"
  okText="取消发布"
  onOk={confirmUnpublishApp}
>
  确定要取消发布<b>{selectedApp?.name}</b>?
</ConfirmDialog>

<ChooseIconModal app={selectedApp} bind:this={iconModal} />

<style>
  .app-actions {
    display: flex;
  }
  .app-actions :global(> button) {
    margin-right: 10px;
  }
  .title .welcome > .buttons {
    padding-top: 30px;
  }
  .title {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-xl);
    flex-wrap: wrap;
  }
  .buttons {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    gap: var(--spacing-xl);
    flex-wrap: wrap;
  }
  @media (max-width: 1000px) {
    .img-logo {
      display: none;
    }
  }
  .filter {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    gap: var(--spacing-xl);
  }
  .appTable {
    display: grid;
    grid-template-rows: auto;
    grid-template-columns: 1fr 1fr 1fr 1fr auto;
    align-items: center;
  }
  .appTable :global(> div) {
    height: 70px;
    display: grid;
    align-items: center;
    grid-gap: var(--spacing-xl);
    grid-template-columns: auto 1fr;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0 var(--spacing-s);
  }
  .appTable :global(> div) {
    border-bottom: var(--border-light);
  }
  @media (max-width: 640px) {
    .appTable {
      grid-template-columns: 1fr auto;
    }
  }
  .empty-wrapper {
    flex: 1 1 auto;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  .img-size {
    width: 160px;
    height: 160px;
  }
</style>
