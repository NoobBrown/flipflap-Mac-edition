<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { appData, initStore, persistStore } from '$lib/stores/appStore';
  import { applyTheme } from '$lib/themes';

  let initialized = false;

  onMount(async () => {
    await initStore();
    initialized = true;
    applyTheme(get(appData).settings.themeIndex);
  });

  // Only persist + re-apply theme after the store has been loaded from disk.
  // Without the flag, the very first subscriber call (with default/empty data)
  // would overwrite the saved file before initStore() reads it.
  appData.subscribe((data) => {
    if (!initialized) return;
    persistStore(data);
    applyTheme(data.settings.themeIndex);
  });
</script>

<slot />
