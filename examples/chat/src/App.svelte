<script lang="ts">
  import { onMount } from 'svelte';
import { SynapseClient } from './lib/synapse';

  const clientId = Math.random().toString(36).substr(2, 9);

  let messages = []
  let presence = []
  const colors = {};
  let input = ""

  let cursors = {};

  let client = new SynapseClient('ws://localhost:8080/ws');

  onMount(async () => {
    await client.connect();

    client.join(['chat', 'cursor']);

    client.on('chat', (msg) => {
      messages = [...messages, msg]
    });

    client.on('cursor', (msg) => {
      cursors = { ...cursors, [msg.sender]: msg.position };
    });

    client.presence('chat', (connections) => {
      presence = connections || []
      presence.forEach(connection => {
        if (!colors[connection]) {
          colors[connection] = randomColor();
        }
      });
    });
  });

  function randomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  $: console.log(colors)

  function handleMouseMove(event) {
    client.broadcast('cursor', { sender: clientId, position: {
      x: event.clientX, y: event.clientY
    } });
  }

  const handleSubmit = () => {
    let message = {
      sender: clientId,
      text: input,
    };

    messages = [...messages, message];

    client.broadcast('chat', message);

    input = "";
  };
</script>

<main class="w-full h-full fixed inset-0 flex flex-col" on:mousemove={handleMouseMove}>
  <ul class="flex-grow">
    {#each messages as message}
      <li>
        <div class="circle" style="background-color: {colors[message.sender]}"></div>
        <p style="color: {colors[message.sender]}">{message.text}</p>
      </li>
    {/each}
  </ul>

  <div class="bg-gray-50 flex flex-col border-t p-4">
     <ul>
      {#each presence as connection}
        <li>
          <div class="circle" style="background-color: {colors[connection]}" title={connection}></div>
        </li>
      {/each}
    </ul>

    <form on:submit|preventDefault={handleSubmit}>
      <input bind:value={input} type="text" />
      <button>Send</button>
    </form>
  </div>

  {#each Object.entries(cursors) as [sender, position]}
    {#if sender !== clientId}
      <div class="w-8 h-8 rounded-full fixed bg-black" style="background-color: {colors[sender]}; left: {position.x}px; top: {position.y}px"></div>
    {/if}
  {/each}
</main>
