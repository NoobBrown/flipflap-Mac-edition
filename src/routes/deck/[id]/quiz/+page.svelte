<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';
  import { appData } from '$lib/stores/appStore';
  import type { Card } from '$lib/types';
  import { onMount, onDestroy } from 'svelte';

  const deckId = $page.params.id;

  interface QuizQuestion {
    card: Card;
    options: string[];
    correctIndex: number;
  }

  let questions: QuizQuestion[] = [];
  let currentQ = 0;
  let selected: number | null = null;
  let done = false;
  let score = 0;
  let deckName = '';
  let deckEmoji = '';
  let countdown = 0;
  let animating = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let interval: ReturnType<typeof setInterval> | null = null;

  function buildQuestions(cards: Card[]): QuizQuestion[] {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    return shuffled.map((card) => {
      const distractors = cards
        .filter((c) => c.id !== card.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((c) => c.back.text);
      const options = [...distractors, card.back.text].sort(() => Math.random() - 0.5);
      const correctIndex = options.indexOf(card.back.text);
      return { card, options, correctIndex };
    });
  }

  function clearTimers() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (interval) { clearInterval(interval); interval = null; }
  }

  onMount(() => {
    const data = get(appData);
    const deck = data.decks.find((d) => d.id === deckId);
    if (!deck || deck.cards.length < 2) {
      goto(`/deck/${deckId}`);
      return;
    }
    deckName = deck.name;
    deckEmoji = deck.emoji;
    questions = buildQuestions(deck.cards);
  });

  onDestroy(clearTimers);

  $: currentQuestion = questions[currentQ];
  $: isCorrect = selected !== null && selected === currentQuestion?.correctIndex;

  function advanceTo(nextFn: () => void) {
    animating = false;
    countdown = 0;
    clearTimers();
    nextFn();
  }

  function next() {
    selected = null;
    if (currentQ + 1 >= questions.length) {
      done = true;
    } else {
      currentQ++;
    }
  }

  function select(idx: number) {
    if (selected !== null) return;
    selected = idx;
    clearTimers();

    if (idx === currentQuestion.correctIndex) {
      score++;
      animating = true;
      timer = setTimeout(() => advanceTo(next), 700);
    } else {
      countdown = 4;
      interval = setInterval(() => {
        countdown--;
        if (countdown <= 0) {
          clearTimers();
          advanceTo(next);
        }
      }, 1000);
    }
  }

  function restart() {
    clearTimers();
    const data = get(appData);
    const deck = data.decks.find((d) => d.id === deckId);
    if (!deck) return;
    questions = buildQuestions(deck.cards);
    currentQ = 0;
    selected = null;
    score = 0;
    done = false;
    animating = false;
    countdown = 0;
  }

  $: percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  $: resultEmoji = percentage >= 80 ? '🎉' : percentage >= 50 ? '💪' : '📖';
  $: resultTitle = percentage >= 80 ? 'Great work!' : percentage >= 50 ? 'Getting there!' : 'Keep studying!';
</script>

<div class="page">
  <header>
    <button class="btn-back" aria-label="Back" on:click={() => { clearTimers(); goto(`/deck/${deckId}`); }}>
      <i class="ti ti-arrow-left"></i>
    </button>
    <div class="session-info">
      <span class="deck-label">{deckEmoji} {deckName}</span>
      {#if !done && questions.length > 0}
        <span class="progress-label">{currentQ + 1} / {questions.length}</span>
      {/if}
    </div>
  </header>

  {#if done}
    <div class="done-screen">
      <div class="done-emoji">{resultEmoji}</div>
      <h2>{resultTitle}</h2>
      <p>You scored <strong>{score}</strong> out of <strong>{questions.length}</strong> ({percentage}%)</p>
      <div class="done-actions">
        <button class="btn-ghost" on:click={() => goto(`/deck/${deckId}`)}>Back to deck</button>
        <button class="btn-primary" on:click={restart}>Try again</button>
      </div>
    </div>
  {:else if currentQuestion}
    <div class="progress-bar">
      <div class="progress-fill" style="width: {(currentQ / questions.length) * 100}%"></div>
    </div>

    <div class="question-area">
      <p class="question-label">Which definition matches?</p>
      <div class="term-card">
        {#if currentQuestion.card.front.imagePath}
          <img class="term-img" src={currentQuestion.card.front.imagePath} alt="" />
        {/if}
        {#if currentQuestion.card.front.text}
          <p class="term-text">{currentQuestion.card.front.text}</p>
        {/if}
      </div>
    </div>

    <div class="options">
      {#each currentQuestion.options as option, idx}
        {@const isSelected = selected === idx}
        {@const isRight = idx === currentQuestion.correctIndex}
        {@const revealed = selected !== null}
        <button
          class="option-btn"
          class:correct={revealed && isRight}
          class:wrong={revealed && isSelected && !isRight}
          class:neutral={revealed && !isSelected && !isRight}
          class:animating={animating && isRight}
          on:click={() => select(idx)}
          disabled={revealed}
        >
          <span class="option-letter">{String.fromCharCode(65 + idx)}</span>
          <span class="option-text">{option}</span>
          {#if revealed && isRight}
            <i class="ti ti-check option-icon"></i>
          {:else if revealed && isSelected && !isRight}
            <i class="ti ti-x option-icon"></i>
          {/if}
        </button>
      {/each}
    </div>

    {#if selected !== null && !isCorrect}
      <div class="feedback-row wrong-feedback">
        <span class="feedback-text wrong-text">
          ✗ The answer was: <strong>{currentQuestion.options[currentQuestion.correctIndex]}</strong>
        </span>
        <span class="countdown-badge">{countdown}s</span>
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

  .deck-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .progress-label {
    font-size: 13px;
    color: var(--text-secondary);
  }

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

  .question-area {
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex-shrink: 0;
  }

  .question-label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-tertiary);
    font-weight: 500;
  }

  .term-card {
    background: var(--bg-primary);
    border: 0.5px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .term-img {
    max-height: 100px;
    max-width: 100%;
    object-fit: contain;
    border-radius: var(--radius-sm);
  }

  .term-text {
    font-size: clamp(16px, 2.8vw, 22px);
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.3;
    text-align: center;
    word-break: break-word;
  }

  .options {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto;
    min-height: 0;
  }

  .option-btn {
    width: 100%;
    background: var(--bg-primary);
    border: 0.5px solid var(--border);
    border-radius: var(--radius-md);
    padding: 13px 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: var(--text-primary);
    text-align: left;
    transition: background 0.12s, border-color 0.12s, transform 0.1s;
  }

  .option-btn:hover:not(:disabled) {
    background: var(--bg-secondary);
    border-color: var(--accent);
  }

  .option-btn:active:not(:disabled) { transform: scale(0.99); }
  .option-btn:disabled { cursor: default; }

  .option-btn.correct {
    background: #dcfce7;
    border-color: #22c55e;
    color: #166534;
  }

  .option-btn.wrong {
    background: #fee2e2;
    border-color: #ef4444;
    color: #991b1b;
  }

  .option-btn.neutral { opacity: 0.45; }

  .option-btn.animating {
    animation: correctPop 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97);
  }

  @keyframes correctPop {
    0%   { transform: scale(1); }
    20%  { transform: scale(1.05); }
    40%  { transform: scale(0.97); }
    60%  { transform: scale(1.03); }
    80%  { transform: scale(0.99); }
    100% { transform: scale(1); }
  }

  .option-letter {
    font-weight: 700;
    font-size: 11px;
    min-width: 20px;
    height: 20px;
    background: var(--bg-tertiary);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .correct .option-letter { background: #bbf7d0; }
  .wrong .option-letter { background: #fecaca; }

  .option-text {
    flex: 1;
    line-height: 1.35;
  }

  .option-icon {
    font-size: 16px;
    flex-shrink: 0;
  }

  .feedback-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    padding: 12px 14px;
    border-radius: var(--radius-lg);
    gap: 12px;
    animation: slideUp 0.2s ease;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .wrong-feedback {
    background: #fee2e2;
    border: 0.5px solid #ef4444;
  }

  .feedback-text {
    font-size: 13px;
    font-weight: 500;
    flex: 1;
    line-height: 1.4;
  }

  .wrong-text { color: #dc2626; }

  .countdown-badge {
    font-size: 12px;
    font-weight: 700;
    color: #dc2626;
    background: #fecaca;
    border-radius: var(--radius-sm);
    padding: 3px 8px;
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
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

  .done-screen h2 {
    font-size: 22px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .done-screen p {
    font-size: 14px;
    color: var(--text-secondary);
  }

  .done-actions {
    display: flex;
    gap: 10px;
    margin-top: 8px;
  }

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
