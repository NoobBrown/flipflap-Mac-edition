<script lang="ts">
  export let onClose: () => void;
  export let onAdd: (
    front: { text: string; imagePath?: string },
    back: { text: string; imagePath?: string }
  ) => void;

  let frontText = '';
  let backText = '';
  let frontImage: string | undefined = undefined;
  let backImage: string | undefined = undefined;

  function readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function onFrontFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) frontImage = await readFile(file);
  }

  async function onBackFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) backImage = await readFile(file);
  }

  function submit() {
    if (!frontText.trim() && !frontImage) return;
    if (!backText.trim() && !backImage) return;
    onAdd(
      { text: frontText.trim(), imagePath: frontImage },
      { text: backText.trim(), imagePath: backImage }
    );
  }

  $: canSubmit = (frontText.trim() || frontImage) && (backText.trim() || backImage);

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="overlay" on:click={onClose} role="presentation">
  <div class="modal" on:click|stopPropagation role="dialog" aria-modal="true">
    <h2>New card</h2>

    <div class="sides">
      <!-- Front -->
      <div class="side">
        <label>Front</label>
        {#if frontImage}
          <div class="img-preview">
            <img src={frontImage} alt="Front" />
            <button class="img-remove" on:click={() => frontImage = undefined} aria-label="Remove image">
              <i class="ti ti-x"></i>
            </button>
          </div>
        {/if}
        <textarea
          class="text-input"
          placeholder="Term, word, or question"
          bind:value={frontText}
          rows="3"
          autofocus
        ></textarea>
        <label class="img-upload-btn">
          <i class="ti ti-photo"></i> Add image
          <input type="file" accept="image/*" on:change={onFrontFile} />
        </label>
      </div>

      <div class="side-divider"></div>

      <!-- Back -->
      <div class="side">
        <label>Back</label>
        {#if backImage}
          <div class="img-preview">
            <img src={backImage} alt="Back" />
            <button class="img-remove" on:click={() => backImage = undefined} aria-label="Remove image">
              <i class="ti ti-x"></i>
            </button>
          </div>
        {/if}
        <textarea
          class="text-input"
          placeholder="Definition, translation, or answer"
          bind:value={backText}
          rows="3"
        ></textarea>
        <label class="img-upload-btn">
          <i class="ti ti-photo"></i> Add image
          <input type="file" accept="image/*" on:change={onBackFile} />
        </label>
      </div>
    </div>

    <div class="modal-actions">
      <button class="btn-ghost" on:click={onClose}>Cancel</button>
      <button class="btn-primary" on:click={submit} disabled={!canSubmit}>
        Add card
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

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .modal {
    background: var(--bg-primary);
    border-radius: var(--radius-xl);
    padding: 24px;
    width: 100%;
    max-width: 520px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    animation: slideUp 0.2s ease;
    max-height: 90vh;
    overflow-y: auto;
  }

  @keyframes slideUp {
    from { transform: translateY(8px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  h2 {
    font-size: 17px;
    font-weight: 500;
  }

  .sides {
    display: grid;
    grid-template-columns: 1fr 1px 1fr;
    gap: 16px;
  }

  .side {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .side > label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .side-divider {
    background: var(--border);
  }

  .img-preview {
    position: relative;
    border-radius: var(--radius-md);
    overflow: hidden;
    background: var(--bg-secondary);
  }

  .img-preview img {
    width: 100%;
    max-height: 120px;
    object-fit: cover;
    display: block;
  }

  .img-remove {
    position: absolute;
    top: 6px;
    right: 6px;
    background: rgba(0,0,0,0.5);
    color: #fff;
    border: none;
    border-radius: 50%;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 12px;
  }

  .text-input {
    width: 100%;
    background: var(--bg-secondary);
    border: 0.5px solid var(--border);
    border-radius: var(--radius-md);
    padding: 10px 12px;
    font-size: 13px;
    color: var(--text-primary);
    font-family: var(--font);
    outline: none;
    resize: none;
    transition: border-color 0.15s;
  }

  .text-input:focus {
    border-color: var(--accent);
  }

  .img-upload-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    background: var(--bg-secondary);
    border: 0.5px solid var(--border);
    transition: color 0.15s, border-color 0.15s;
    text-transform: none;
    font-weight: 400;
    letter-spacing: normal;
  }

  .img-upload-btn:hover {
    color: var(--accent);
    border-color: var(--accent);
  }

  .img-upload-btn input {
    display: none;
  }

  .modal-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .btn-primary {
    background: var(--accent);
    color: #fff;
    border: none;
    padding: 9px 18px;
    border-radius: var(--radius-md);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.1s;
  }

  .btn-primary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .btn-primary:not(:disabled):active {
    transform: scale(0.95);
  }

  .btn-ghost {
    background: var(--bg-secondary);
    border: 0.5px solid var(--border);
    padding: 9px 18px;
    border-radius: var(--radius-md);
    font-size: 13px;
    cursor: pointer;
    color: var(--text-primary);
    transition: opacity 0.15s;
  }
</style>
