<script lang="ts">
  import { base } from '$app/paths';
  import '@picocss/pico/css/pico.css';
  import {
    getAllKeys,
    getAllTranslationsForLanguage,
    getMissingForLanguage,
    getString,
  } from '../../../translations';
  import { distinct } from '../../../misc';
  import { onMount } from 'svelte';
  import ExportView from '../../../view/exportView.svelte';
  import { getLocalisatio, setLocalisatio } from '../../../storage';
  import { browser } from '$app/environment';

  let lang: string;
  onMount(() => {
    lang = navigator.language?.split('-')[0];
  });
  $: missingTranslation = getMissingForLanguage(lang);
  const allKeys = getAllKeys();

  $: table = getAllTranslationsForLanguage(lang);

  $: browser ? setLocalisatio(lang, table) : undefined;

  let exportJson: string | undefined;

  let filterMissing = true;

  function exportData() {
    console.log('exportng');
    exportJson = JSON.stringify(
      Object.fromEntries(
        Object.entries(getLocalisatio(lang))
          .filter(([key, value]) => value?.length ?? 0 > 0)
          .map(([key, value]) => [key, value.trim()] as const)
      ),
      undefined,
      2
    );
  }
</script>

<ExportView bind:exportJson />

<main class="container">
  <h1>{getString('Missing Translations', lang)} 🏗️</h1>
  <p>
    {getString(
      "This shoould list all texts used and not yet translated in your language. However it's not applied everywhere yet. Player Aid should be colpletly set, but others are missing.",
      lang
    )}
  </p>
  <p>
    {getString(
      'If You translated somthing please open an issue on Github, and post the exported text, or if you know how to do it directly open a pull request.',
      lang
    )}
  </p>
  <p>
    {getString(
      'After I inculdede your text, everyone should see your texts online. Currently your translations are stored in your borwesr, so you can check if it works like expocted. Those are marked with `«»` .',
      lang
    )}
  </p>
  <p>
    <a href="https://lokimidgard.github.io/tragedy-looper-deduction-">Github Reposetory</a>
  </p>

  <label>
    {getString('Language', lang)}
    <input type="tel" bind:value={lang} />
  </label>

  <button on:click={() => exportData()}>Export</button>

  <label>
    {getString('Only show Missing', lang)}
    <input type="checkbox" role="switch" bind:checked={filterMissing} />
  </label>

  {#if lang}
    <table>
      <colgroup>
        <col style="width: min-content;" />
        <col style="width: 70%;" />
      </colgroup>
      <thead>
        <th>
          {getString('Key', lang)}
        </th>
        <th>
          {getString('Translation', lang)}
        </th>
      </thead>
      <tbody>
        {#each distinct(filterMissing ? missingTranslation : allKeys).sort() as e}
          <tr>
            <td>{e}</td>
            <td>
              <textarea bind:value={table[e]} />
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</main>

<style>
</style>
