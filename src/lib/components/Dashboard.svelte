<script lang="ts">
  import { appData } from '../stores/appStore';
  import { goto } from '$app/navigation';
  import type { Deck } from '../types';
  import NewDeckModal from './NewDeckModal.svelte';
  import NewFolderModal from './NewFolderModal.svelte';
  import SettingsModal from './SettingsModal.svelte';

  let showNewDeck = false;
  let showNewFolder = false;
  let showSettings = false;
  let importMsg = '';
  let importError = false;

  async function onImportDeck(e: Event) {
    importMsg = ''; importError = false;
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      if (payload.app !== 'flipflap') throw new Error('Not a valid .flipflap file.');
      if (payload.v !== 2 || typeof payload.name !== 'string') throw new Error('Expected a single-deck .flipflap file (v2).');
      const deck: Deck = {
        id: crypto.randomUUID(),
        name: payload.name,
        emoji: typeof payload.icon === 'string' ? payload.icon : '',
        cards: Array.isArray(payload.cards)
          ? payload.cards.map((c: Record<string, unknown>) => ({
              id: crypto.randomUUID(),
              front: (c.front && typeof c.front === 'object' ? c.front : { text: '' }) as { text: string; imagePath?: string },
              back:  (c.back  && typeof c.back  === 'object' ? c.back  : { text: '' }) as { text: string; imagePath?: string },
              createdAt: new Date().toISOString(),
            }))
          : [],
        createdAt: new Date().toISOString(),
        streak: 0,
      };
      appData.update((data) => ({ ...data, decks: [...data.decks, deck] }));
      importMsg = `"${deck.name}" imported!`;
      setTimeout(() => { importMsg = ''; }, 3000);
    } catch (err) {
      importError = true;
      importMsg = err instanceof Error ? err.message : 'Import failed.';
      setTimeout(() => { importMsg = ''; importError = false; }, 3000);
    }
    (e.target as HTMLInputElement).value = '';
  }

  // Track which folders are expanded
  let expanded: Record<string, boolean> = {};
  function toggle(id: string) { expanded[id] = !expanded[id]; expanded = { ...expanded }; }

  const GREETINGS = [
    (n: string) => `${n} Returns`,
    (n: string) => `Welcome Back, ${n}`,
    (n: string) => `The Return of ${n}`,
    (n: string) => `${n} Is Back`,
    (n: string) => `${n} Rises`,
    (n: string) => `Look Who's Back — ${n}`,
    (n: string) => `${n}, Let's Go`,
    (n: string) => `${n} Has Entered the Building`,
    (n: string) => `${n} Is in the Zone`,
    (n: string) => `Good to See You, ${n}`,
  ];

  const SUBS = [
    'Ready to crush some cards?',
    "Let's keep that streak alive.",
    'A few cards a day keeps forgetting away.',
    'Your future self will thank you.',
    'Small steps, big memory.',
    'The grind never stops.',
  ];

  const greetFn = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
  const subLine = SUBS[Math.floor(Math.random() * SUBS.length)];

  $: name = $appData.settings.name || 'Learner';
  $: greeting = greetFn(name);
  $: totalCards = $appData.decks.reduce((sum, d) => sum + d.cards.length, 0);
  $: streak = $appData.settings.studyStreak ?? 0;
  $: reviewedToday = (() => {
    const today = new Date().toISOString().slice(0, 10);
    return $appData.settings.todayDate === today ? ($appData.settings.reviewedToday ?? 0) : 0;
  })();

  $: folders = $appData.folders;
  $: unfiledDecks = $appData.decks.filter((d) => !d.folderId);
  function decksInFolder(folderId: string) {
    return $appData.decks.filter((d) => d.folderId === folderId);
  }

  function deleteFolder(folderId: string) {
    appData.update((data) => ({
      ...data,
      folders: data.folders.filter((f) => f.id !== folderId),
      // Unfile decks that were in this folder
      decks: data.decks.map((d) => d.folderId === folderId ? { ...d, folderId: undefined } : d),
    }));
  }
</script>

<div class="dashboard">
  <header>
    <div class="greeting">
      <h1>{greeting}</h1>
      <p>{subLine}</p>
    </div>
    <div class="actions">
      <button class="btn-secondary" on:click={() => showNewFolder = true} title="New folder">
        <i class="ti ti-folder-plus"></i>
      </button>
      <label class="btn-secondary" title="Import deck">
        <i class="ti ti-upload"></i>
        <input type="file" accept=".flipflap,.json" on:change={onImportDeck} style="display:none" />
      </label>
      <button class="btn-primary" on:click={() => showNewDeck = true}>
        <i class="ti ti-plus"></i> New deck
      </button>
      <button class="btn-icon" on:click={() => showSettings = true} aria-label="Settings">
        <i class="ti ti-settings"></i>
      </button>
    </div>
  </header>

  {#if importMsg}
    <div class="import-toast" class:error={importError}>{importMsg}</div>
  {/if}

  <div class="stats">
    <div class="stat-card">
      <span class="stat-label">Cards</span>
      <span class="stat-value">{totalCards}</span>
    </div>
    <div class="stat-card">
      <span class="stat-label">Streak</span>
      <span class="stat-value">{streak > 0 ? `🔥 ${streak}d` : '—'}</span>
    </div>
    <div class="stat-card">
      <span class="stat-label">Today</span>
      <span class="stat-value">{reviewedToday}</span>
    </div>
  </div>

  <!-- Folders -->
  {#each folders as folder}
    {@const folderDecks = decksInFolder(folder.id)}
    <div class="folder-block">
      <div
        class="folder-header"
        role="button"
        tabindex="0"
        on:click={() => toggle(folder.id)}
        on:keydown={(e) => e.key === 'Enter' && toggle(folder.id)}
      >
        <div class="folder-left">
          <i class="ti ti-chevron-{expanded[folder.id] ? 'down' : 'right'} folder-chevron"></i>
          {#if folder.icon}
            <i class="ti ti-{folder.icon} folder-icon"></i>
          {:else}
            <i class="ti ti-folder folder-icon"></i>
          {/if}
          <span class="folder-name">{folder.name}</span>
          <span class="folder-count">{folderDecks.length}</span>
        </div>
        <button
          class="btn-folder-del"
          on:click|stopPropagation={() => deleteFolder(folder.id)}
          aria-label="Delete folder"
        >
          <i class="ti ti-trash"></i>
        </button>
      </div>

      {#if expanded[folder.id]}
        <div class="folder-decks">
          {#if folderDecks.length === 0}
            <p class="folder-empty">No decks in this folder yet.</p>
          {:else}
            {#each folderDecks as deck}
              <div
                class="deck-card"
                role="button"
                tabindex="0"
                on:click={() => goto(`/deck/${deck.id}`)}
                on:keydown={(e) => e.key === 'Enter' && goto(`/deck/${deck.id}`)}
              >
                <div class="deck-icon-wrap">
                  {#if deck.emoji}
                    <i class="ti ti-{deck.emoji}"></i>
                  {/if}
                </div>
                <div class="deck-info">
                  <span class="deck-name">{deck.name}</span>
                  <span class="deck-count">{deck.cards.length} card{deck.cards.length !== 1 ? 's' : ''}</span>
                </div>
                <i class="ti ti-chevron-right deck-arrow"></i>
              </div>
            {/each}
          {/if}
        </div>
      {/if}
    </div>
  {/each}

  <!-- Unfiled decks -->
  <div class="deck-list">
    {#if unfiledDecks.length === 0 && folders.length === 0}
      <div class="empty">
        <p>No decks yet — create your first one!</p>
      </div>
    {:else if unfiledDecks.length > 0}
      {#if folders.length > 0}
        <p class="section-label">Unfiled</p>
      {/if}
      {#each unfiledDecks as deck}
        <div
          class="deck-card"
          role="button"
          tabindex="0"
          on:click={() => goto(`/deck/${deck.id}`)}
          on:keydown={(e) => e.key === 'Enter' && goto(`/deck/${deck.id}`)}
        >
          <div class="deck-icon-wrap">
            {#if deck.emoji}
              <i class="ti ti-{deck.emoji}"></i>
            {/if}
          </div>
          <div class="deck-info">
            <span class="deck-name">{deck.name}</span>
            <span class="deck-count">{deck.cards.length} card{deck.cards.length !== 1 ? 's' : ''}</span>
          </div>
          <i class="ti ti-chevron-right deck-arrow"></i>
        </div>
      {/each}
    {/if}
  </div>
</div>

{#if showNewDeck}
  <NewDeckModal onClose={() => showNewDeck = false} />
{/if}
{#if showNewFolder}
  <NewFolderModal onClose={() => showNewFolder = false} />
{/if}
{#if showSettings}
  <SettingsModal onClose={() => showSettings = false} />
{/if}

<style>
  .dashboard {
    padding: 16px;
    height: 100vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .greeting h1 {
    font-size: clamp(16px, 2.5vw, 22px);
    font-weight: 500;
    color: var(--text-primary);
    line-height: 1.25;
    word-break: break-word;
    max-width: 340px;
  }

  .greeting p {
    font-size: 13px;
    color: var(--text-secondary);
    margin-top: 4px;
  }

  .actions { display: flex; gap: 8px; flex-shrink: 0; align-items: center; }

  .btn-primary {
    background: var(--accent);
    color: #fff;
    border: none;
    padding: 8px 14px;
    border-radius: var(--radius-md);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: opacity 0.15s, transform 0.1s;
    white-space: nowrap;
  }

  .btn-primary:active { transform: scale(0.95); opacity: 0.85; }

  .btn-secondary {
    background: var(--bg-secondary);
    border: 0.5px solid var(--border);
    padding: 8px 10px;
    border-radius: var(--radius-md);
    cursor: pointer;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    font-size: 17px;
    transition: color 0.15s, transform 0.1s;
  }

  .btn-secondary:hover { color: var(--accent); }
  .btn-secondary:active { transform: scale(0.95); }

  .import-toast {
    background: #f0fdf4; border: 0.5px solid #22c55e; color: #15803d;
    border-radius: var(--radius-md); padding: 10px 14px;
    font-size: 13px; font-weight: 500;
    animation: fadeIn 0.2s ease;
    flex-shrink: 0;
  }
  .import-toast.error { background: #fef2f2; border-color: #ef4444; color: #dc2626; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

  .btn-icon {
    background: var(--bg-secondary);
    border: 0.5px solid var(--border);
    padding: 8px 10px;
    border-radius: var(--radius-md);
    cursor: pointer;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    transition: color 0.15s, transform 0.1s;
  }

  .btn-icon:hover { color: var(--text-primary); }
  .btn-icon:active { transform: scale(0.95); }
  .btn-icon i { font-size: 18px; }

  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .stat-card {
    background: var(--bg-primary);
    border: 0.5px solid var(--border);
    border-radius: var(--radius-md);
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .stat-label { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
  .stat-value { font-size: clamp(18px, 2.5vw, 24px); font-weight: 500; color: var(--text-primary); }

  /* ── Folders ── */
  .folder-block {
    background: var(--bg-primary);
    border: 0.5px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .folder-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    cursor: pointer;
    user-select: none;
    transition: background 0.12s;
  }

  .folder-header:hover { background: var(--bg-secondary); }

  .folder-left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .folder-chevron { font-size: 14px; color: var(--text-tertiary); flex-shrink: 0; }
  .folder-icon { font-size: 18px; color: var(--accent); flex-shrink: 0; }
  .folder-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .folder-count {
    font-size: 11px;
    background: var(--bg-tertiary);
    color: var(--text-tertiary);
    border-radius: 999px;
    padding: 1px 7px;
    flex-shrink: 0;
  }

  .btn-folder-del {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-tertiary);
    font-size: 15px;
    display: flex;
    align-items: center;
    padding: 4px;
    border-radius: var(--radius-sm);
    transition: color 0.15s;
    flex-shrink: 0;
  }

  .btn-folder-del:hover { color: #ef4444; }

  .folder-decks {
    border-top: 0.5px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .folder-empty {
    padding: 12px 16px;
    font-size: 13px;
    color: var(--text-tertiary);
  }

  /* ── Deck cards ── */
  .deck-list { display: flex; flex-direction: column; gap: 6px; }

  .section-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--text-tertiary);
    padding: 0 2px;
  }

  .empty {
    text-align: center;
    padding: 48px 24px;
    color: var(--text-tertiary);
    font-size: 14px;
  }

  .deck-card {
    background: var(--bg-primary);
    border: 0.5px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 13px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: background 0.12s, transform 0.1s;
  }

  /* Deck cards inside a folder have no border/radius of their own */
  .folder-decks .deck-card {
    border-radius: 0;
    border: none;
    border-bottom: 0.5px solid var(--border);
  }

  .folder-decks .deck-card:last-child { border-bottom: none; }

  .deck-card:hover { background: var(--bg-secondary); }
  .deck-card:active { transform: scale(0.99); }

  .deck-icon-wrap {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: var(--accent);
    flex-shrink: 0;
  }

  .deck-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .deck-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .deck-count { font-size: 12px; color: var(--text-secondary); }
  .deck-arrow { font-size: 16px; color: var(--text-tertiary); flex-shrink: 0; }
</style>
