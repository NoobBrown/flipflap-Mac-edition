<script lang="ts">
  import { get } from 'svelte/store';
  import { appData } from '../stores/appStore';
  import { THEMES, applyTheme } from '../themes';
  import type { Deck } from '../types';

  export let onClose: () => void;

  let name = $appData.settings.name;
  let themeIndex = $appData.settings.themeIndex;
  let studyOrder = $appData.settings.studyOrder;

  let exportMsg = '';
  let importMsg = '';
  let importError = false;

  const lightThemes = THEMES.map((t, i) => ({ ...t, i })).filter(t => !t.dark);
  const darkThemes  = THEMES.map((t, i) => ({ ...t, i })).filter(t =>  t.dark);

  function save() {
    appData.update((d) => ({
      ...d,
      settings: { ...d.settings, name, themeIndex, studyOrder },
    }));
    onClose();
  }

  function selectTheme(idx: number) {
    themeIndex = idx;
    applyTheme(idx);
    appData.update((d) => ({ ...d, settings: { ...d.settings, themeIndex: idx } }));
  }

  // ── Export ────────────────────────────────────────────────────────────────
  function exportDecks() {
    const data = get(appData);
    if (data.decks.length === 0) { exportMsg = 'No decks to export.'; return; }
    const payload = {
      v: 1, app: 'flipflap',
      exportedAt: new Date().toISOString(),
      folders: data.folders,
      decks: data.decks.map((d) => ({
        name: d.name, emoji: d.emoji, folderId: d.folderId,
        cards: d.cards.map((c) => ({ front: c.front, back: c.back })),
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flipflap-${new Date().toISOString().slice(0, 10)}.flipflap`;
    a.click();
    URL.revokeObjectURL(url);
    exportMsg = `Exported ${data.decks.length} deck${data.decks.length !== 1 ? 's' : ''}.`;
  }

  // ── Import ────────────────────────────────────────────────────────────────
  function parseCard(c: Record<string, unknown>) {
    return {
      id: crypto.randomUUID(),
      front: (c.front && typeof c.front === 'object' ? c.front : { text: '' }) as { text: string; imagePath?: string },
      back:  (c.back  && typeof c.back  === 'object' ? c.back  : { text: '' }) as { text: string; imagePath?: string },
      createdAt: new Date().toISOString(),
    };
  }

  async function onImportFile(e: Event) {
    importMsg = ''; importError = false;
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      if (payload.app !== 'flipflap') throw new Error('Not a valid .flipflap file.');

      let newDecks: Deck[] = [];
      let newFolders: typeof $appData.folders = [];

      if (payload.v === 2 && typeof payload.name === 'string') {
        // Single-deck format (v2)
        newDecks = [{
          id: crypto.randomUUID(),
          name: payload.name,
          emoji: typeof payload.icon === 'string' ? payload.icon : '',
          cards: Array.isArray(payload.cards) ? payload.cards.map(parseCard) : [],
          createdAt: new Date().toISOString(),
          streak: 0,
        }];
      } else if (Array.isArray(payload.decks)) {
        // Legacy multi-deck format (v1)
        const folderIdMap: Record<string, string> = {};
        newFolders = Array.isArray(payload.folders)
          ? payload.folders.map((f: Record<string, unknown>) => {
              const newId = crypto.randomUUID();
              if (typeof f.id === 'string') folderIdMap[f.id] = newId;
              return { id: newId, name: typeof f.name === 'string' ? f.name : 'Folder', icon: typeof f.icon === 'string' ? f.icon : '', createdAt: new Date().toISOString() };
            })
          : [];
        newDecks = payload.decks.map((d: Record<string, unknown>) => ({
          id: crypto.randomUUID(),
          name: typeof d.name === 'string' ? d.name : 'Imported deck',
          emoji: typeof d.emoji === 'string' ? d.emoji : '',
          folderId: typeof d.folderId === 'string' && folderIdMap[d.folderId] ? folderIdMap[d.folderId] : undefined,
          cards: Array.isArray(d.cards) ? d.cards.map(parseCard) : [],
          createdAt: new Date().toISOString(),
          streak: 0,
        }));
      } else {
        throw new Error('Not a valid .flipflap file.');
      }

      appData.update((data) => ({
        ...data,
        folders: [...data.folders, ...newFolders],
        decks: [...data.decks, ...newDecks],
      }));
      importMsg = `Imported ${newDecks.length} deck${newDecks.length !== 1 ? 's' : ''}.`;
    } catch (err) {
      importError = true;
      importMsg = err instanceof Error ? err.message : 'Import failed.';
    }
    (e.target as HTMLInputElement).value = '';
  }

  function resetStats() {
    appData.update((d) => ({
      ...d,
      settings: { ...d.settings, studyStreak: 0, lastStudyDate: '', reviewedToday: 0, todayDate: '' },
    }));
  }

  function handleKeydown(e: KeyboardEvent) { if (e.key === 'Escape') save(); }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="overlay" on:click={save} role="presentation">
  <div class="modal" on:click|stopPropagation role="dialog" aria-modal="true">

    <div class="modal-header">
      <h2>Settings</h2>
      <button class="btn-close" on:click={save}><i class="ti ti-x"></i></button>
    </div>

    <!-- Profile -->
    <section>
      <p class="section-label">Profile</p>
      <label class="field-label" for="name-input">Your name</label>
      <input id="name-input" class="text-input" type="text" placeholder="e.g. Alex" bind:value={name} autofocus />
      <p class="field-hint">Used in your dashboard greeting.</p>
    </section>

    <div class="divider"></div>

    <!-- Appearance -->
    <section>
      <p class="section-label">Appearance</p>

      <p class="theme-group-label"><i class="ti ti-sun"></i> Light themes</p>
      <div class="theme-grid">
        {#each lightThemes as theme}
          <button class="theme-swatch" class:active={themeIndex === theme.i} on:click={() => selectTheme(theme.i)} title={theme.name}>
            <span class="swatch-dot" style="background:{theme.swatch}"></span>
            <span class="swatch-name">{theme.name}</span>
          </button>
        {/each}
      </div>

      <p class="theme-group-label"><i class="ti ti-moon"></i> Dark themes</p>
      <div class="theme-grid">
        {#each darkThemes as theme}
          <button class="theme-swatch dark" class:active={themeIndex === theme.i} on:click={() => selectTheme(theme.i)} title={theme.name}>
            <span class="swatch-dot" style="background:{theme.swatch}"></span>
            <span class="swatch-name">{theme.name}</span>
          </button>
        {/each}
      </div>
    </section>

    <div class="divider"></div>

    <!-- Study -->
    <section>
      <p class="section-label">Study</p>
      <label class="field-label">Card order</label>
      <div class="toggle-group">
        <button class="toggle-btn" class:active={studyOrder === 'random'} on:click={() => studyOrder = 'random'}>
          <i class="ti ti-shuffle"></i> Random
        </button>
        <button class="toggle-btn" class:active={studyOrder === 'sequential'} on:click={() => studyOrder = 'sequential'}>
          <i class="ti ti-sort-ascending"></i> Sequential
        </button>
      </div>
    </section>

    <div class="divider"></div>

    <!-- Data -->
    <section>
      <p class="section-label">Data</p>
      <div class="data-row">
        <div class="data-block">
          <p class="field-label">Export decks</p>
          <p class="field-hint">Save all decks as a <code>.flipflap</code> file.</p>
          <button class="btn-secondary" on:click={exportDecks}><i class="ti ti-download"></i> Export all</button>
          {#if exportMsg}<p class="status-msg">{exportMsg}</p>{/if}
        </div>
        <div class="data-block">
          <p class="field-label">Import decks</p>
          <p class="field-hint">Add decks from a <code>.flipflap</code> file.</p>
          <label class="btn-secondary">
            <i class="ti ti-upload"></i> Import
            <input type="file" accept=".flipflap,.json" on:change={onImportFile} />
          </label>
          {#if importMsg}<p class="status-msg" class:error={importError}>{importMsg}</p>{/if}
        </div>
      </div>
      <div class="danger-zone">
        <p class="field-label">Reset study stats</p>
        <p class="field-hint">Clears streak and today's count. Decks are not affected.</p>
        <button class="btn-danger" on:click={resetStats}>Reset stats</button>
      </div>
    </section>

    <div class="modal-footer">
      <button class="btn-primary" on:click={save}>Done</button>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed; inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex; align-items: center; justify-content: center;
    z-index: 100;
    animation: fadeIn 0.15s ease;
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .modal {
    background: var(--bg-primary);
    border-radius: var(--radius-xl);
    width: 100%; max-width: 460px; max-height: 90vh;
    display: flex; flex-direction: column;
    overflow-y: auto;
    animation: slideUp 0.2s ease;
  }

  @keyframes slideUp {
    from { transform: translateY(10px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }

  .modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 20px 0; flex-shrink: 0;
  }

  h2 { font-size: 17px; font-weight: 600; color: var(--text-primary); }

  .btn-close {
    background: var(--bg-secondary); border: 0.5px solid var(--border);
    border-radius: var(--radius-sm); padding: 5px 7px;
    cursor: pointer; color: var(--text-secondary);
    display: flex; align-items: center; transition: color 0.15s;
  }
  .btn-close:hover { color: var(--text-primary); }
  .btn-close i { font-size: 15px; }

  section { padding: 16px 20px; display: flex; flex-direction: column; gap: 8px; }

  .section-label {
    font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: var(--text-tertiary);
  }

  .field-label { font-size: 13px; font-weight: 500; color: var(--text-primary); display: block; }
  .field-hint { font-size: 11px; color: var(--text-tertiary); line-height: 1.4; margin-top: -4px; }

  .text-input {
    width: 100%; background: var(--bg-secondary);
    border: 0.5px solid var(--border); border-radius: var(--radius-md);
    padding: 9px 12px; font-size: 14px; color: var(--text-primary);
    font-family: var(--font); outline: none; transition: border-color 0.15s;
  }
  .text-input:focus { border-color: var(--accent); }

  .divider { height: 0.5px; background: var(--border); flex-shrink: 0; margin: 0 20px; }

  /* Theme grid */
  .theme-group-label {
    font-size: 11px; font-weight: 600; color: var(--text-secondary);
    display: flex; align-items: center; gap: 5px; margin-top: 4px;
  }

  .theme-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }

  .theme-swatch {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    padding: 10px 6px; border-radius: var(--radius-md);
    border: 1.5px solid transparent;
    background: var(--bg-secondary);
    cursor: pointer; transition: border-color 0.15s, background 0.15s;
  }
  .theme-swatch.dark { background: #1a1a1a; }
  .theme-swatch:hover { background: var(--bg-tertiary); }
  .theme-swatch.dark:hover { background: #222; }
  .theme-swatch.active { border-color: var(--accent); background: var(--accent-light); }
  .theme-swatch.dark.active { background: #2a2a2a; }

  .swatch-dot {
    width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  .swatch-name { font-size: 10px; font-weight: 500; color: var(--text-secondary); text-align: center; line-height: 1.2; }
  .theme-swatch.dark .swatch-name { color: #aaa; }
  .theme-swatch.active .swatch-name { color: var(--accent); }
  .theme-swatch.dark.active .swatch-name { color: #c4b5fd; }

  /* Toggle group */
  .toggle-group { display: flex; gap: 6px; }
  .toggle-btn {
    flex: 1; padding: 9px 12px; border-radius: var(--radius-md);
    border: 0.5px solid var(--border); background: var(--bg-secondary);
    color: var(--text-secondary); font-size: 13px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }
  .toggle-btn.active { background: var(--accent-light); color: var(--accent); border-color: var(--accent); font-weight: 500; }

  /* Data */
  .data-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .data-block { display: flex; flex-direction: column; gap: 6px; }

  .btn-secondary {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--bg-secondary); border: 0.5px solid var(--border);
    border-radius: var(--radius-md); padding: 8px 12px;
    font-size: 12px; font-weight: 500; color: var(--text-primary);
    cursor: pointer; transition: background 0.15s, border-color 0.15s; width: fit-content;
  }
  .btn-secondary:hover { background: var(--bg-tertiary); border-color: var(--accent); }
  .btn-secondary input { display: none; }

  .status-msg { font-size: 11px; color: var(--accent); font-weight: 500; }
  .status-msg.error { color: #ef4444; }

  code { font-family: monospace; font-size: 11px; background: var(--bg-tertiary); padding: 1px 4px; border-radius: 3px; }

  .danger-zone { display: flex; flex-direction: column; gap: 4px; padding-top: 8px; border-top: 0.5px solid var(--border); margin-top: 4px; }

  .btn-danger {
    background: none; border: 0.5px solid #ef4444; color: #ef4444;
    padding: 7px 12px; border-radius: var(--radius-md);
    font-size: 12px; font-weight: 500; cursor: pointer; width: fit-content;
    transition: background 0.15s;
  }
  .btn-danger:hover { background: #fee2e2; }

  .modal-footer {
    padding: 14px 20px; display: flex; justify-content: flex-end;
    flex-shrink: 0; border-top: 0.5px solid var(--border);
  }

  .btn-primary {
    background: var(--accent); color: #fff; border: none;
    padding: 9px 24px; border-radius: var(--radius-md);
    font-size: 13px; font-weight: 500; cursor: pointer;
    transition: opacity 0.15s, transform 0.1s;
  }
  .btn-primary:active { transform: scale(0.95); }
</style>
