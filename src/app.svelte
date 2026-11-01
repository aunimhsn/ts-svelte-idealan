<script lang="ts">
  import fr from "./i18n/fr.json";
  import { pingServer, type ServerStatus } from "./lib/server-status";

  let status = $state<ServerStatus>("checking");

  $effect(() => {
    pingServer().then((result) => (status = result));
  });
</script>

<main>
  <h1>{fr.app.name}</h1>
  <p>{fr.app.description}</p>
  <p role="status">{fr.status[status]}</p>
</main>

<style>
  main {
    max-width: 40rem;
    margin-inline: auto;
    padding: 1rem;
  }
</style>
