<script>
  import ViewDataTable from "components/backend/DataTable/ViewDataTable.svelte"
  import { views, database } from "stores/backend"

  $: selectedView = $views.selected
</script>

{#if $database._id && selectedView}
  <ViewDataTable view={selectedView} />
{:else}<i>创建第一个数据表</i>{/if}

<style>
  i {
    font-size: var(--font-size-m);
    color: var(--grey-4);
    margin-top: 2px;
  }
</style>
