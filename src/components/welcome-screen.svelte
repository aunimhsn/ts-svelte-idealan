<!-- The welcome (specs.md, Welcome): the access code, the nickname and the personal code, each
     with its help or its error below it, then « Entrer ». A banner says why a friend is back. -->
<script lang="ts">
  import { tick, untrack } from "svelte";
  import fr from "../i18n/fr.json";
  import type { AppState } from "../lib/app-state.svelte";
  import { readNickname } from "../lib/field-rules";
  import {
    welcomeMessage,
    type WelcomeError,
    type WelcomeField,
  } from "../lib/messages";
  import AppLogo from "./app-logo.svelte";

  let { app }: { app: AppState } = $props();

  // Filled again with what the browser kept after a refusal: the access code and the nickname.
  let accessCode = $state(untrack(() => app.kept.accessCode ?? ""));
  let nickname = $state(untrack(() => app.kept.nickname ?? ""));
  let personalCode = $state("");
  let error = $state<WelcomeError | null>(null);
  let entering = $state(false);

  const inputs: Partial<Record<WelcomeField, HTMLInputElement>> = {};

  const errorOf = (field: WelcomeField) =>
    error?.field === field
      ? welcomeMessage(error.code, readNickname(nickname) ?? nickname)
      : null;

  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (entering) return;
    entering = true;
    error = await app.enter({ accessCode, nickname, personalCode });
    entering = false;
    if (error !== null) {
      await tick();
      inputs[error.field]?.focus();
    }
  };
</script>

<main class="welcome">
  {#if app.notice !== null}
    <p class="banner" role="status">{fr.notices[app.notice]}</p>
  {/if}
  <div class="head">
    <div class="head-logo"><AppLogo size={72} /></div>
    <h1 class="display">{fr.app.name}</h1>
    <p class="lead">{fr.app.lead}</p>
  </div>
  <form class="form" novalidate onsubmit={submit}>
    <div class="field" class:is-invalid={errorOf("accessCode") !== null}>
      <label for="welcome-access-code">{fr.welcome.accessCode}</label>
      <input
        id="welcome-access-code"
        bind:this={inputs.accessCode}
        bind:value={accessCode}
        type="password"
        placeholder={fr.welcome.accessCodePlaceholder}
        autocapitalize="off"
        autocomplete="off"
        spellcheck="false"
        aria-invalid={errorOf("accessCode") !== null}
        aria-describedby={errorOf("accessCode") !== null
          ? "welcome-access-code-note"
          : undefined}
      />
      {#if errorOf("accessCode") !== null}
        <small id="welcome-access-code-note" class="is-error">
          {errorOf("accessCode")}
        </small>
      {/if}
    </div>
    <div class="field" class:is-invalid={errorOf("nickname") !== null}>
      <label for="welcome-nickname">{fr.welcome.nickname}</label>
      <input
        id="welcome-nickname"
        bind:this={inputs.nickname}
        bind:value={nickname}
        type="text"
        maxlength="16"
        placeholder={fr.welcome.nicknamePlaceholder}
        autocapitalize="off"
        autocomplete="off"
        spellcheck="false"
        aria-invalid={errorOf("nickname") !== null}
        aria-describedby="welcome-nickname-note"
      />
      <small
        id="welcome-nickname-note"
        class:is-error={errorOf("nickname") !== null}
      >
        {errorOf("nickname") ?? fr.welcome.nicknameHint}
      </small>
    </div>
    <div class="field" class:is-invalid={errorOf("personalCode") !== null}>
      <label for="welcome-personal-code">{fr.welcome.personalCode}</label>
      <input
        id="welcome-personal-code"
        bind:this={inputs.personalCode}
        bind:value={personalCode}
        type="password"
        inputmode="numeric"
        maxlength="4"
        placeholder={fr.welcome.personalCodePlaceholder}
        autocomplete="off"
        aria-invalid={errorOf("personalCode") !== null}
        aria-describedby="welcome-personal-code-note"
      />
      <small
        id="welcome-personal-code-note"
        class:is-error={errorOf("personalCode") !== null}
      >
        {errorOf("personalCode") ?? fr.welcome.personalCodeHint}
      </small>
    </div>
    <div class="submit">
      <button
        type="submit"
        class="button is-primary is-wide"
        disabled={entering}
      >
        {#if entering}
          <span class="spinner" aria-hidden="true"></span>{fr.welcome.entering}
        {:else}
          {fr.welcome.enter}
        {/if}
      </button>
      {#if errorOf("form") !== null}
        <p class="message is-error" role="alert">{errorOf("form")}</p>
      {/if}
    </div>
  </form>
</main>

<style>
  .welcome {
    flex: 1;
    width: 100%;
    max-width: var(--width-welcome);
    margin: 0 auto;
    padding: var(--space-12) var(--space-4) var(--space-6);
  }

  .banner {
    margin-bottom: var(--space-8);
  }

  .head {
    position: relative;
    margin-bottom: var(--space-8);
    text-align: center;
  }

  .head-logo {
    display: flex;
    justify-content: center;
    margin-bottom: var(--space-4);
  }

  /* « Idealan » in Montserrat 800, uppercase, glowing. */
  .display {
    margin: 0;
    font-family: var(--font-brand);
    font-size: var(--size-display);
    font-weight: var(--weight-black);
    line-height: var(--leading-none);
    letter-spacing: var(--tracking-brand);
    text-transform: uppercase;
    text-shadow: var(--glow-text);
  }

  .lead {
    margin: var(--space-3) 0 0;
    color: var(--secondary);
  }

  .form {
    display: grid;
    gap: var(--space-6);
  }

  .submit {
    display: grid;
    gap: var(--space-3);
  }

  @media (width >= 900px) {
    .welcome {
      padding-top: 12vh;
    }
  }
</style>
