<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';
  import { appData, recordStudySession } from '$lib/stores/appStore';
  import type { Card } from '$lib/types';
  import { onMount } from 'svelte';

  const deckId = $page.params.id;

  let queue: Card[] = [];
  let flipped = false;
  let hasFlipped = false;
  let done = false;
  let totalCards = 0;
  let deckName = '';
  let deckEmoji = '';
  let gotItCount = 0;

  onMount(() => {
    const data = get(appData);
    const deck = data.decks.find((d) => d.id === deckId);
    if (!deck || deck.cards.length === 0) {
      goto(`/deck/${deckId}`);
      return;
    }
    deckName = deck.name;
    deckEmoji = deck.emoji;
    const cards = [...deck.cards];
    queue = data.settings.studyOrder === 'sequential'
      ? cards
      : cards.sort(() => Math.random() - 0.5);
    totalCards = queue.length;
  });

  $: current = queue[0];

  function toggleFlip() {
    flipped = !flipped;
    if (flipped) hasFlipped = true;
  }

  function gotIt() {
    gotItCount++;
    recordStudySession(1);
    queue = queue.slice(1);
    flipped = false;
    hasFlipped = false;
    if (queue.length === 0) done = true;
  }

  function stillLearning() {
    const [card, ...rest] = queue;
    queue = [...rest, card];
    flipped = false;
    hasFlipped = false;
  }

  function restart() {
    const data = get(appData);
    const deck = data.decks.find((d) => d.id === deckId);
    if (!deck) return;
    const cards = [...deck.cards];
    queue = data.settings.studyOrder === 'sequential'
      ? cards
      : cards.sort(() => Math.random() - 0.5);
    totalCards = queue.length;
    gotItCount = 0;
    flipped = false;
    hasFlipped = false;
    done = false;
  }
</script>

<div class="page">
  <header>
    <button class="btn-back" on:click={() => goto(`/deck/${deckId}`)}>
      <i class="ti ti-arrow-left"></i>
    </button>
    <div class="session-info">
      <span class="deck-label">{deckEmoji} {deckName}</span>
      {#if !done && totalCards > 0}
        <span class="progress-label">{gotItCount} / {totalCards}</span>
      {/if}
    </div>
  </header>

  {#if done}
    <div class="done-screen">
      <div class="done-emoji">🎉</div>
      <h2>All done!</h2>
      <p>You went through all {totalCards} card{totalCards !== 1 ? 's' : ''}.</p>
      <div class="done-actions">
        <button class="btn-ghost" on:click={() => goto(`/deck/${deckId}`)}>Back to deck</button>
        <button class="btn-primary" on:click={restart}>Study again</button>
      </div>
    </div>
  {:else if current}
    {#if totalCards > 0}
      <div class="progress-bar">
        <div class="progress-fill" style="width: {(gotItCount / totalCards) * 100}%"></div>
      </div>
    {/if}

    <div class="card-area">
      <div
        class="flashcard"
        class:flipped
        on:click={toggleFlip}
        role="button"
        tabindex="0"
        on:keydown={(e) => e.key === ' ' && toggleFlip()}
      >
        <div class="card-inner">
          <div class="card-face card-front-face">
            <span class="face-label">Front</span>
            {#if current.front.imagePath}
              <img class="card-img" src={current.front.imagePath} alt="" />
            {/if}
            {#if current.front.text}
              <p class="card-text">{current.front.text}</p>
            {/if}
            <span class="tap-hint">Tap to flip</span>
          </div>
          <div class="card-face card-back-face">
            <span class="face-label">Back</span>
            {#if current.back.imagePath}
              <img class="card-img" src={current.back.imagePath} alt="" />
            {/if}
            {#if current.back.text}
              <p class="card-text">{current.back.text}</p>
            {/if}
            <span class="tap-hint">Tap to flip back</span>
          </div>
        </div>
      </div>
    </div>

    {#if hasFlipped}
      <div class="answer-actions">
        <button class="btn-still-learning" on:click={stillLearning}>
          <i class="ti ti-refresh"></i>
          Still Learning
        </button>
        <button class="btn-got-it" on:click={gotIt}>
          <i class="ti ti-check"></i>
          Got it!
        </button>
      </div>
    {:else}
      <div class="remaining-hint">
        {queue.length} card{queue.length !== 1 ? 's' : ''} remaining
      </div>
    {/if}
  {:else}
    <div class="loading">Loading...</div>
  {/if}
</div>

<style>
  .page {
    padding: 16px;
    height: 100vh;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: hidden;
  }

  header {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
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

  .session-info {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .deck-label { font-size: 14px; font-weight: 500; color: var(--text-primary); }
  .progress-label { font-size: 13px; color: var(--text-secondary); }

  .progress-bar {
    height: 4px;
    background: var(--bg-tertiary);
    border-radius: 2px;
    overflow: hidden;
    flex-shrink: 0;
  }

  .progress-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .card-area {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    perspective: 1200px;
    min-height: 0;
  }

  .flashcard {
    width: 100%;
    max-width: 640px;
    height: min(440px, calc(100vh - 220px));
    cursor: pointer;
    transform-style: preserve-3d;
    transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }

  .flashcard.flipped { transform: rotateY(180deg); }

  .card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
  }

  .card-face {
    position: absolute;
    inset: 0;
    background: var(--bg-primary);
    border: 0.5px solid var(--border);
    border-radius: var(--radius-xl);
    backface-visibility: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 36px;
    gap: 16px;
    overflow: hidden;
  }

  .card-back-face {
    transform: rotateY(180deg);
    background: var(--accent-light);
    border-color: var(--accent);
  }

  .face-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-tertiary);
    font-weight: 500;
    position: absolute;
    top: 14px;
  }

  .card-back-face .face-label { color: var(--accent); }

  .card-img {
    max-width: 100%;
    max-height: 200px;
    object-fit: contain;
    border-radius: var(--radius-sm);
  }

  .card-text {
    font-size: clamp(20px, 4vw, 34px);
    font-weight: 500;
    color: var(--text-primary);
    text-align: center;
    line-height: 1.4;
    word-break: break-word;
    overflow-y: auto;
    max-height: 60%;
  }

  .card-back-face .card-text { color: var(--accent-dark); }

  .tap-hint {
    font-size: 11px;
    color: var(--text-tertiary);
    position: absolute;
    bottom: 14px;
  }

  .card-back-face .tap-hint { color: var(--accent); opacity: 0.6; }

  .answer-actions {
    display: flex;
    gap: 10px;
    flex-shrink: 0;
    padding-bottom: 8px;
  }

  .btn-still-learning, .btn-got-it {
    flex: 1;
    padding: 14px;
    border-radius: var(--radius-lg);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: transform 0.1s, opacity 0.15s;
  }

  .btn-still-learning {
    background: var(--bg-secondary);
    border: 0.5px solid var(--border);
    color: var(--text-primary);
  }

  .btn-got-it { background: #22c55e; color: #fff; }
  .btn-still-learning:active, .btn-got-it:active { transform: scale(0.97); }

  .remaining-hint {
    text-align: center;
    font-size: 13px;
    color: var(--text-tertiary);
    flex-shrink: 0;
    padding-bottom: 8px;
  }

  .done-screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    text-align: center;
  }

  .done-emoji { font-size: 52px; }
  .done-screen h2 { font-size: 22px; font-weight: 600; color: var(--text-primary); }
  .done-screen p { font-size: 14px; color: var(--text-secondary); }

  .done-actions { display: flex; gap: 10px; margin-top: 8px; }

  .btn-primary {
    background: var(--accent);
    color: #fff;
    border: none;
    padding: 10px 20px;
    border-radius: var(--radius-md);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.1s;
  }

  .btn-primary:active { transform: scale(0.95); }

  .btn-ghost {
    background: var(--bg-secondary);
    border: 0.5px solid var(--border);
    padding: 10px 20px;
    border-radius: var(--radius-md);
    font-size: 13px;
    cursor: pointer;
    color: var(--text-primary);
  }

  .loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-tertiary);
    font-size: 14px;
  }
</style>
