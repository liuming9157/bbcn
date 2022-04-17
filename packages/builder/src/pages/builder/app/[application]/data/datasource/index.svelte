<script>
  import { datasources } from "stores/backend"
  import { goto } from "@roxi/routify"
  import { onMount } from "svelte"

  onMount(async () => {
    // navigate to first table in list, if not already selected
    $datasources.list.length > 0 && $goto(`./${$datasources.list[0]._id}`)
  })
</script>

{#if $datasources.list.length === 0}
  <i>连接你的第一个数据.</i>
{:else}<i>修改数据库连接</i>{/if}

<style>
  i {
    font-size: var(--font-size-m);
    color: var(--grey-5);
    margin-top: 2px;
  }
</style>
