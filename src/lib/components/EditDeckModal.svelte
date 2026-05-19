<script lang="ts">
  import { appData } from '../stores/appStore';
  import { ICON_GROUPS } from '../icons';

  export let deckId: string;
  export let initialName: string;
  export let initialIcon: string;
  export let onClose: () => void;

  let deckName = initialName;
  let selectedIcon = initialIcon;
  let iconSearch = '';
  const MAX_NAME = 60;

  $: filteredGroups = iconSearch.trim()
    ? [{ label: 'Results', icons: ICON_GROUPS.flatMap(g => g.icons).filter(i => i.includes(iconSearch.trim().toLowerCase())) }]
    : ICON_GROUPS;

  function save() {
    if (!deckName.trim()) return;
    appData.update((data) => ({
      ...data,
      decks: data.decks.map((d) =>
        d.id === deckId
          ? { ...d, name: deckName.trim().slice(0, MAX_NAME), emoji: selectedIcon }
          : d
      ),
    }));
    onClose();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && e.target === document.getElementById('edit-deck-name')) save();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="overlay" on:click={onClose} role="presentation">
  <div class="modal" on:click|stopPropagation role="dialog" aria-modal="true">
    <h2>Edit deck</h2>

    <div class="field">
      <div class="name-row">
        <input
          id="edit-deck-name"
          class="text-input"
          type="text"
          placeholder="Deck name"
          bind:value={deckName}
          maxlength={MAX_NAME}
          autofocus
        />
        <span class="char-count" class:warn={deckName.length > MAX_NAME - 10}>
          {deckName.length}/{MAX_NAME}
        </span>
      </div>
    </div>

    <div class="field">
      <div class="icon-picker-header">
        <span class="field-label">Icon</span>
        <input
          class="icon-search"
          type="text"
          placeholder="Search icons…"
          bind:value={iconSearch}
        />
      </div>

      <div class="icon-none-row">
        <button
          class="icon-none-btn"
          class:selected={selectedIcon === ''}
          on:click={() => selectedIcon = ''}
        >
          No icon
        </button>
      </div>

      <div class="icon-scroll">
        {#each filteredGroups as group}
          {#if group.icons.length > 0}
            <p class="group-label">{group.label}</p>
            <div class="icon-grid">
              {#each group.icons as icon}
                <button
                  class="icon-btn"
                  class:selected={selectedIcon === icon}
                  title={icon}
                  on:click={() => selectedIcon = icon}
                >
                  <i class="ti ti-{icon}"></i>
                </button>
              {/each}
            </div>
          {/if}
        {/each}
        {#if filteredGroups.every(g => g.icons.length === 0)}
          <p class="no-results">No icons match "{iconSearch}"</p>
        {/if}
      </div>
    </div>

    <div class="modal-actions">
      <button class="btn-ghost" on:click={onClose}>Cancel</button>
      <button class="btn-primary" on:click={save} disabled={!deckName.trim()}>
        Save
      </button>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    animation: fadeIn 0.15s ease;
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .modal {
    background: var(--bg-primary);
    border-radius: var(--radius-xl);
    padding: 24px;
    width: 100%;
    max-width: 460px;
    max-height: 88vh;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow: hidden;
    animation: slideUp 0.2s ease;
  }

  @keyframes slideUp {
    from { transform: translateY(8px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  h2 { font-size: 17px; font-weight: 600; color: var(--text-primary); }

  .field { display: flex; flex-direction: column; gap: 8px; }

  .name-row { display: flex; align-items: center; gap: 8px; }

  .text-input {
    flex: 1;
    background: var(--bg-secondary);
    border: 0.5px solid var(--border);
    border-radius: var(--radius-md);
    padding: 10px 12px;
    font-size: 14px;
    color: var(--text-primary);
    font-family: var(--font);
    outline: none;
    transition: border-color 0.15s;
    min-width: 0;
  }
  .text-input:focus { border-color: var(--accent); }

  .char-count { font-size: 11px; color: var(--text-tertiary); flex-shrink: 0; font-variant-numeric: tabular-nums; }
  .char-count.warn { color: #e55; }

  .field-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-tertiary); }

  .icon-picker-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }

  .icon-search {
    background: var(--bg-secondary);
    border: 0.5px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 5px 10px;
    font-size: 12px;
    color: var(--text-primary);
    font-family: var(--font);
    outline: none;
    transition: border-color 0.15s;
    width: 160px;
  }
  .icon-search:focus { border-color: var(--accent); }

  .icon-none-row { margin-bottom: 4px; }

  .icon-none-btn {
    background: var(--bg-secondary);
    border: 1.5px solid transparent;
    border-radius: var(--radius-sm);
    padding: 5px 12px;
    font-size: 12px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }
  .icon-none-btn.selected { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }

  .icon-scroll {
    overflow-y: auto;
    max-height: 260px;
    padding-right: 4px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .group-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-tertiary); margin-bottom: 2px; }

  .icon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(40px, 1fr)); gap: 4px; }

  .icon-btn {
    aspect-ratio: 1;
    background: var(--bg-secondary);
    border: 1.5px solid transparent;
    border-radius: var(--radius-sm);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: var(--text-secondary);
    transition: border-color 0.12s, color 0.12s, background 0.12s, transform 0.1s;
  }
  .icon-btn:hover { background: var(--bg-tertiary); color: var(--text-primary); }
  .icon-btn:active { transform: scale(0.9); }
  .icon-btn.selected { border-color: var(--accent); background: var(--accent-light); color: var(--accent); }

  .no-results { font-size: 13px; color: var(--text-tertiary); text-align: center; padding: 16px 0; }

  .modal-actions { display: flex; gap: 8px; justify-content: flex-end; flex-shrink: 0; }

  .btn-primary {
    background: var(--accent); color: #fff; border: none;
    padding: 9px 18px; border-radius: var(--radius-md);
    font-size: 13px; font-weight: 500; cursor: pointer;
    transition: opacity 0.15s, transform 0.1s;
  }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-primary:not(:disabled):active { transform: scale(0.95); }

  .btn-ghost {
    background: var(--bg-secondary); border: 0.5px solid var(--border);
    padding: 9px 18px; border-radius: var(--radius-md);
    font-size: 13px; cursor: pointer; color: var(--text-primary);
  }
</style>
