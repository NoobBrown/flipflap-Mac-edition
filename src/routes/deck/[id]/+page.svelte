<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { appData } from '$lib/stores/appStore';
  import NewCardModal from '$lib/components/NewCardModal.svelte';
  import EditDeckModal from '$lib/components/EditDeckModal.svelte';

  $: deckId = $page.params.id;
  $: deck = $appData.decks.find((d) => d.id === deckId);
  $: folders = $appData.folders;

  let showNewCard = false;
  let showEditDeck = false;
  let confirmDelete = false;

  function addCard(
    front: { text: string; imagePath?: string },
    back: { text: string; imagePath?: string }
  ) {
    appData.update((data) => ({
      ...data,
      decks: data.decks.map((d) =>
        d.id === deckId
          ? { ...d, cards: [...d.cards, { id: crypto.randomUUID(), front, back, createdAt: new Date().toISOString() }] }
          : d
      ),
    }));
    showNewCard = false;
  }

  function deleteCard(cardId: string) {
    appData.update((data) => ({
      ...data,
      decks: data.decks.map((d) =>
        d.id === deckId ? { ...d, cards: d.cards.filter((c) => c.id !== cardId) } : d
      ),
    }));
  }

  function deleteDeck() {
    appData.update((data) => ({ ...data, decks: data.decks.filter((d) => d.id !== deckId) }));
    goto('/');
  }

  function setFolder(folderId: string) {
    appData.update((data) => ({
      ...data,
      decks: data.decks.map((d) =>
        d.id === deckId ? { ...d, folderId: folderId || undefined } : d
      ),
    }));
  }

  function exportDeck() {
    if (!deck) return;
    const payload = {
      v: 2,
      app: 'flipflap',
      exportedAt: new Date().toISOString(),
      name: deck.name,
      icon: deck.emoji,
      cards: deck.cards.map((c) => ({ front: c.front, back: c.back })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.flipflap`;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

{#if !deck}
  <div class="not-found">
    <p>Deck not found.</p>
    <button class="btn-ghost" on:click={() => goto('/')}>Go home</button>
  </div>
{:else}
  <div class="page">
    <header>
      <button class="btn-back" aria-label="Back" on:click={() => goto('/')}>
        <i class="ti ti-arrow-left"></i>
      </button>
      <div class="deck-title">
        {#if deck.emoji}
          <i class="ti ti-{deck.emoji} deck-icon"></i>
        {/if}
        <h1>{deck.name}</h1>
        <button class="btn-edit-deck" on:click={() => showEditDeck = true} aria-label="Edit deck">
          <i class="ti ti-pencil"></i>
        </button>
      </div>
      <div class="header-actions">
        {#if confirmDelete}
          <div class="confirm-delete">
            <span>Delete deck?</span>
            <button class="btn-confirm-yes" on:click={deleteDeck}>Yes</button>
            <button class="btn-confirm-no" on:click={() => confirmDelete = false}>No</button>
          </div>
        {:else}
          <button class="btn-icon-sm" on:click={exportDeck} aria-label="Export deck">
            <i class="ti ti-download"></i>
          </button>
          <button class="btn-danger-icon" on:click={() => confirmDelete = true} aria-label="Delete deck">
            <i class="ti ti-trash"></i>
          </button>
          <button class="btn-add" on:click={() => showNewCard = true}>
            <i class="ti ti-plus"></i> Add card
          </button>
        {/if}
      </div>
    </header>

    <!-- Folder selector -->
    {#if folders.length > 0}
      <div class="folder-row">
        <i class="ti ti-folder folder-icon-sm"></i>
        <select class="folder-select" value={deck.folderId ?? ''} on:change={(e) => setFolder((e.target as HTMLSelectElement).value)}>
          <option value="">No folder</option>
          {#each folders as f}
            <option value={f.id}>{f.icon ? '' : ''}{f.name}</option>
          {/each}
        </select>
      </div>
    {/if}

    <!-- Study modes row -->
    {#if deck.cards.length > 0}
      <div class="study-grid">
        <button class="study-btn" on:click={() => goto(`/deck/${deckId}/study`)}>
          <i class="ti ti-cards"></i>
          <span>Flashcards</span>
        </button>
        <button class="study-btn" on:click={() => goto(`/deck/${deckId}/write`)}>
          <i class="ti ti-keyboard"></i>
          <span>Write</span>
        </button>
        <button class="study-btn" on:click={() => goto(`/deck/${deckId}/quiz`)} disabled={deck.cards.length < 2}>
          <i class="ti ti-list-check"></i>
          <span>Multiple choice</span>
          {#if deck.cards.length < 2}<small>Need 2+ cards</small>{/if}
        </button>
      </div>
    {/if}

    <!-- Card list -->
    <div class="card-list">
      {#if deck.cards.length === 0}
        <div class="empty"><p>No cards yet — add your first one!</p></div>
      {:else}
        {#each deck.cards as card, i}
          <div class="card-row">
            <span class="card-index">{i + 1}</span>
            <div class="card-sides">
              <div class="card-side-cell">
                {#if card.front.imagePath}<img class="card-thumb" src={card.front.imagePath} alt="" />{/if}
                {#if card.front.text}<span class="card-front">{card.front.text}</span>{/if}
              </div>
              <span class="card-sep">→</span>
              <div class="card-side-cell">
                {#if card.back.imagePath}<img class="card-thumb" src={card.back.imagePath} alt="" />{/if}
                {#if card.back.text}<span class="card-back">{card.back.text}</span>{/if}
              </div>
            </div>
            <button class="btn-delete" on:click={() => deleteCard(card.id)} aria-label="Delete card">
              <i class="ti ti-trash"></i>
            </button>
          </div>
        {/each}
      {/if}
    </div>
  </div>

  {#if showNewCard}
    <NewCardModal onClose={() => showNewCard = false} onAdd={addCard} />
  {/if}

  {#if showEditDeck && deck}
    <EditDeckModal
      deckId={deck.id}
      initialName={deck.name}
      initialIcon={deck.emoji}
      onClose={() => showEditDeck = false}
    />
  {/if}
{/if}

<style>
  .page {
    padding: 16px;
    height: 100vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  header {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .btn-back {
    background: var(--bg-secondary);
    border: 0.5px solid var(--border);
    padding: 8px 10px;
    border-radius: var(--radius-md);
    cursor: pointer;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    flex-shrink: 0;
    transition: transform 0.1s;
  }
  .btn-back:active { transform: scale(0.95); }
  .btn-back i { font-size: 18px; }

  .deck-title {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .deck-icon { font-size: 22px; color: var(--accent); flex-shrink: 0; }

  .btn-edit-deck {
    background: none; border: none; cursor: pointer;
    color: var(--text-tertiary); display: flex; align-items: center;
    padding: 4px; border-radius: var(--radius-sm);
    transition: color 0.15s; flex-shrink: 0;
  }
  .btn-edit-deck:hover { color: var(--accent); }
  .btn-edit-deck i { font-size: 16px; }

  h1 {
    font-size: 20px;
    font-weight: 500;
    color: var(--text-primary);
    word-break: break-word;
    overflow-wrap: break-word;
    min-width: 0;
    max-width: 100%;
  }

  .header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

  .confirm-delete {
    display: flex; align-items: center; gap: 8px;
    background: var(--bg-secondary); border: 0.5px solid var(--border);
    border-radius: var(--radius-md); padding: 6px 10px;
    font-size: 13px; color: var(--text-secondary);
    animation: fadeIn 0.15s ease;
  }

  @keyframes fadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }

  .btn-confirm-yes { background: #ef4444; color: #fff; border: none; padding: 4px 10px; border-radius: var(--radius-sm); font-size: 12px; font-weight: 500; cursor: pointer; }
  .btn-confirm-no { background: var(--bg-tertiary); border: none; padding: 4px 10px; border-radius: var(--radius-sm); font-size: 12px; cursor: pointer; color: var(--text-primary); }

  .btn-icon-sm {
    background: var(--bg-secondary); border: 0.5px solid var(--border);
    padding: 8px 10px; border-radius: var(--radius-md);
    cursor: pointer; color: var(--text-tertiary);
    display: flex; align-items: center;
    transition: color 0.15s, transform 0.1s;
  }
  .btn-icon-sm:hover { color: var(--accent); }
  .btn-icon-sm:active { transform: scale(0.95); }
  .btn-icon-sm i { font-size: 17px; }

  .btn-danger-icon {
    background: var(--bg-secondary); border: 0.5px solid var(--border);
    padding: 8px 10px; border-radius: var(--radius-md);
    cursor: pointer; color: var(--text-tertiary);
    display: flex; align-items: center;
    transition: color 0.15s, transform 0.1s;
  }
  .btn-danger-icon:hover { color: #ef4444; }
  .btn-danger-icon:active { transform: scale(0.95); }
  .btn-danger-icon i { font-size: 17px; }

  .btn-add {
    background: var(--accent); color: #fff; border: none;
    padding: 8px 14px; border-radius: var(--radius-md);
    font-size: 13px; font-weight: 500; cursor: pointer;
    display: flex; align-items: center; gap: 6px;
    transition: opacity 0.15s, transform 0.1s;
  }
  .btn-add:active { transform: scale(0.95); opacity: 0.85; }

  /* Folder row */
  .folder-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .folder-icon-sm { font-size: 16px; color: var(--text-tertiary); flex-shrink: 0; }

  /* folder-select inherits global select styles */

  .study-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    flex-shrink: 0;
  }

  .study-btn {
    background: var(--bg-primary);
    border: 0.5px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 12px 10px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 500;
    transition: background 0.12s, transform 0.1s, color 0.12s;
  }
  .study-btn:hover:not(:disabled) { background: var(--accent-light); color: var(--accent); }
  .study-btn:active:not(:disabled) { transform: scale(0.97); }
  .study-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .study-btn i { font-size: 24px; }
  .study-btn small { font-size: 10px; color: var(--text-tertiary); font-weight: 400; }

  /* Card list */
  .card-list { display: flex; flex-direction: column; gap: 6px; }

  .empty { text-align: center; padding: 48px 24px; color: var(--text-tertiary); font-size: 14px; }

  .card-row {
    background: var(--bg-primary);
    border: 0.5px solid var(--border);
    border-radius: var(--radius-md);
    padding: 12px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .card-index { font-size: 12px; color: var(--text-tertiary); min-width: 18px; text-align: right; flex-shrink: 0; }

  .card-sides { flex: 1; display: flex; align-items: center; gap: 8px; font-size: 13px; overflow: hidden; }

  .card-side-cell { display: flex; align-items: center; gap: 6px; overflow: hidden; flex: 1; }

  .card-thumb { width: 32px; height: 32px; object-fit: cover; border-radius: 4px; flex-shrink: 0; }

  .card-front { font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .card-sep { color: var(--text-tertiary); flex-shrink: 0; }
  .card-back { color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .btn-delete { background: none; border: none; cursor: pointer; color: var(--text-tertiary); display: flex; align-items: center; padding: 4px; border-radius: var(--radius-sm); transition: color 0.15s; flex-shrink: 0; }
  .btn-delete:hover { color: #e55; }
  .btn-delete i { font-size: 16px; }

  .not-found { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; gap: 12px; color: var(--text-secondary); font-size: 14px; }
  .btn-ghost { background: var(--bg-secondary); border: 0.5px solid var(--border); padding: 9px 18px; border-radius: var(--radius-md); font-size: 13px; cursor: pointer; color: var(--text-primary); }
</style>
