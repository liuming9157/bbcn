<script>
  import { ActionButton } from "@budibase/bbui"

  export let hideAutocolumns

  function hideOrUnhide() {
    hideAutocolumns = !hideAutocolumns
  }
</script>

<ActionButton icon="MagicWand" primary size="S" quiet on:click={hideOrUnhide}>
  {#if hideAutocolumns}显示自动列{:else}隐藏自动列{/if}
</ActionButton>
