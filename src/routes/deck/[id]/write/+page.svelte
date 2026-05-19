<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';
  import { appData, recordStudySession } from '$lib/stores/appStore';
  import type { Card } from '$lib/types';
  import { onMount } from 'svelte';

  const deckId = $page.params.id;

  let queue: Card[] = [];
  let totalCards = 0;
  let deckName = '';
  let deckEmoji = '';

  // Per-card state
  let answer = '';
  let checked = false;
  let isCorrect = false;
  let score = 0;
  let done = false;

  let inputEl: HTMLInputElement;

  onMount(() => {
    const data = get(appData);
    const deck = data.decks.find((d) => d.id === deckId);
    if (!deck || deck.cards.length === 0) { goto(`/deck/${deckId}`); return; }
    deckName = deck.name;
    deckEmoji = deck.emoji;
    const cards = [...deck.cards];
    queue = data.settings.studyOrder === 'sequential' ? cards : cards.sort(() => Math.random() - 0.5);
    totalCards = queue.length;
  });

  $: current = queue[0];
  $: progress = totalCards - queue.length;

  function checkAnswer() {
    if (!answer.trim()) return;
    checked = true;
    const correct = current.back.text.trim().toLowerCase();
    const given   = answer.trim().toLowerCase();
    isCorrect = given === correct;
    if (isCorrect) { score++; recordStudySession(1); }
  }

  function advance() {
    queue = queue.slice(1);
    answer = '';
    checked = false;
    isCorrect = false;
    if (queue.length === 0) done = true;
    else setTimeout(() => inputEl?.focus(), 50);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      if (!checked) checkAnswer();
      else advance();
    }
  }

  function restart() {
    const data = get(appData);
    const deck = data.decks.find((d) => d.id === deckId);
    if (!deck) return;
    const cards = [...deck.cards];
    queue = data.settings.studyOrder === 'sequential' ? cards : cards.sort(() => Math.random() - 0.5);
    totalCards = queue.length;
    answer = ''; checked = false; isCorrect = false; score = 0; done = false;
    setTimeout(() => inputEl?.focus(), 50);
  }

  $: percentage = totalCards > 0 ? Math.round((score / totalCards) * 100) : 0;
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="page">
  <header>
    <button class="btn-back" aria-label="Back" on:click={() => goto(`/deck/${deckId}`)}>
      <i class="ti ti-arrow-left"></i>
    </button>
    <div class="session-info">
      <span class="deck-label">{deckEmoji ? '' : ''}{deckName}</span>
      {#if !done && totalCards > 0}
        <span class="progress-label">{progress} / {totalCards}</span>
      {/if}
    </div>
  </header>

  {#if done}
    <div class="done-screen">
      <div class="done-emoji">{percentage >= 80 ? '🎉' : percentage >= 50 ? '💪' : '📖'}</div>
      <h2>{percentage >= 80 ? 'Great work!' : percentage >= 50 ? 'Getting there!' : 'Keep studying!'}</h2>
      <p>You got <strong>{score}</strong> of <strong>{totalCards}</strong> correct ({percentage}%)</p>
      <div class="done-actions">
        <button class="btn-ghost" on:click={() => goto(`/deck/${deckId}`)}>Back to deck</button>
        <button class="btn-primary" on:click={restart}>Try again</button>
      </div>
    </div>
  {:else if current}
    <div class="progress-bar">
      <div class="progress-fill" style="width:{(progress / totalCards) * 100}%"></div>
    </div>

    <div class="card-area">
      <!-- Term card -->
      <div class="term-card">
        <span class="face-label">What is the answer?</span>
        {#if current.front.imagePath}
          <img class="card-img" src={current.front.imagePath} alt="" />
        {/if}
        {#if current.front.text}
          <p class="term-text">{current.front.text}</p>
        {/if}
      </div>

      <!-- Answer input -->
      <div class="answer-area" class:correct={checked && isCorrect} class:wrong={checked && !isCorrect}>
        <input
          bind:this={inputEl}
          class="answer-input"
          type="text"
          placeholder="Type your answer…"
          bind:value={answer}
          disabled={checked}
          autofocus
        />

        {#if checked}
          <div class="feedback">
            {#if isCorrect}
              <span class="feedback-correct"><i class="ti ti-check"></i> Correct!</span>
            {:else}
              <div class="feedback-wrong">
                <span><i class="ti ti-x"></i> Incorrect</span>
                <span class="correct-answer">Answer: <strong>{current.back.text}</strong></span>
                {#if current.back.imagePath}
                  <img class="answer-img" src={current.back.imagePath} alt="" />
                {/if}
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    <div class="bottom-actions">
      {#if !checked}
        <button class="btn-check" on:click={checkAnswer} disabled={!answer.trim()}>
          Check <kbd>↵</kbd>
        </button>
      {:else}
        <button class="btn-next" on:click={advance}>
          {queue.length > 1 ? 'Next' : 'Finish'} <kbd>↵</kbd>
        </button>
      {/if}
    </div>
  {:else}
    <div class="loading">Loading…</div>
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

  header { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }

  .btn-back {
    background: var(--bg-secondary); border: 0.5px solid var(--border);
    padding: 8px 10px; border-radius: var(--radius-md);
    cursor: pointer; color: var(--text-secondary);
    display: flex; align-items: center; flex-shrink: 0; transition: transform 0.1s;
  }
  .btn-back:active { transform: scale(0.95); }
  .btn-back i { font-size: 18px; }

  .session-info { flex: 1; display: flex; align-items: center; justify-content: space-between; }
  .deck-label { font-size: 14px; font-weight: 500; color: var(--text-primary); }
  .progress-label { font-size: 13px; color: var(--text-secondary); }

  .progress-bar { height: 4px; background: var(--bg-tertiary); border-radius: 2px; overflow: hidden; flex-shrink: 0; }
  .progress-fill { height: 100%; background: var(--accent); border-radius: 2px; transition: width 0.3s ease; }

  .card-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
    justify-content: center;
    overflow-y: auto;
    min-height: 0;
  }

  .term-card {
    background: var(--bg-primary);
    border: 0.5px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    text-align: center;
    flex-shrink: 0;
  }

  .face-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-tertiary);
    font-weight: 500;
  }

  .card-img { max-height: 120px; max-width: 100%; object-fit: contain; border-radius: var(--radius-sm); }

  .term-text {
    font-size: clamp(18px, 3.5vw, 28px);
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.3;
    word-break: break-word;
  }

  .answer-area {
    background: var(--bg-primary);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition: border-color 0.2s, background 0.2s;
    flex-shrink: 0;
  }

  .answer-area.correct { border-color: #22c55e; background: #f0fdf4; }
  .answer-area.wrong   { border-color: #ef4444; background: #fef2f2; }

  .answer-input {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    font-size: 18px;
    font-family: var(--font);
    color: var(--text-primary);
    padding: 0;
  }

  .answer-input::placeholder { color: var(--text-tertiary); }
  .answer-input:disabled { color: var(--text-secondary); }

  .feedback { display: flex; flex-direction: column; gap: 6px; }

  .feedback-correct { font-size: 14px; font-weight: 600; color: #16a34a; display: flex; align-items: center; gap: 6px; }
  .feedback-correct i { font-size: 16px; }

  .feedback-wrong { display: flex; flex-direction: column; gap: 6px; }
  .feedback-wrong > span:first-child { font-size: 14px; font-weight: 600; color: #dc2626; display: flex; align-items: center; gap: 6px; }
  .feedback-wrong > span:first-child i { font-size: 16px; }

  .correct-answer { font-size: 14px; color: var(--text-secondary); }
  .correct-answer strong { color: var(--text-primary); }

  .answer-img { max-height: 80px; object-fit: contain; border-radius: var(--radius-sm); }

  .bottom-actions { display: flex; justify-content: flex-end; flex-shrink: 0; padding-bottom: 8px; }

  .btn-check, .btn-next {
    background: var(--accent); color: #fff; border: none;
    padding: 12px 28px; border-radius: var(--radius-lg);
    font-size: 14px; font-weight: 500; cursor: pointer;
    display: flex; align-items: center; gap: 8px;
    transition: opacity 0.15s, transform 0.1s;
  }
  .btn-check:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-check:not(:disabled):active, .btn-next:active { transform: scale(0.96); }

  kbd {
    font-size: 11px;
    background: rgba(255,255,255,0.25);
    border-radius: 4px;
    padding: 2px 6px;
    font-family: var(--font);
  }

  .done-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; }
  .done-emoji { font-size: 52px; }
  .done-screen h2 { font-size: 22px; font-weight: 600; color: var(--text-primary); }
  .done-screen p { font-size: 14px; color: var(--text-secondary); }
  .done-actions { display: flex; gap: 10px; margin-top: 8px; }

  .btn-primary { background: var(--accent); color: #fff; border: none; padding: 10px 20px; border-radius: var(--radius-md); font-size: 13px; font-weight: 500; cursor: pointer; transition: opacity 0.15s, transform 0.1s; }
  .btn-primary:active { transform: scale(0.95); }
  .btn-ghost { background: var(--bg-secondary); border: 0.5px solid var(--border); padding: 10px 20px; border-radius: var(--radius-md); font-size: 13px; cursor: pointer; color: var(--text-primary); }

  .loading { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--text-tertiary); font-size: 14px; }
</style>
