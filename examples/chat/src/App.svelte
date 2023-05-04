<script lang="ts">
  import { onMount } from 'svelte';

  let messages = []
  let presence = []
  const clientId = Math.random().toString(36).substr(2, 9);
  const colors = {};

  let cursors = {};

  const socket = new WebSocket('ws://synapse-rs.fly.dev/ws');

  onMount(() => {
    socket.addEventListener('open', function (_event) {
      socket.send(JSON.stringify({ type: 'join', channel: 'chat' }))
      socket.send(JSON.stringify({ type: 'join', channel: 'cursor' }));
    })

    socket.addEventListener('message', function (event) {
      const { type, channel, body, connections } = JSON.parse(event.data)

      if (type === 'broadcast' && channel === 'chat') {
        messages = [...messages, body]
      } else if (type === 'broadcast' && channel === 'cursor') {
        cursors = { ...cursors, [body.sender]: body.position };
      } else if (type === 'presence' && channel === 'chat') {
        presence = connections || []
        presence.forEach(connection => {
          if (!colors[connection]) {
            colors[connection] = randomColor();
          }
        });
      }
    })
  });

  function randomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  $: console.log(cursors)

  function handleMouseMove(event) {
    const position = { x: event.clientX, y: event.clientY };
    socket.send(JSON.stringify({ type: 'broadcast', channel: 'cursor', body: { sender: clientId, position } }));
  }
</script>

<style>
  main {
    font-family: Arial, sans-serif;
    width: 100%;
    margin: 0 auto;
    padding: 16px;
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .circle {
    width: 24px;
    height: 24px;
    border-radius: 50%;
  }

  form {
    display: flex;
    gap: 8px;
  }

  input[type="text"] {
    flex-grow: 1;
  }

  .cursor {
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: currentcolor;
  }
</style>

<main on:mousemove={handleMouseMove}>
  <ul>
    {#each messages as message}
      <li>
        <div class="circle" style="background-color: {colors[message.sender]}"></div>
        <p style="color: {colors[message.sender]}">{message.text}</p>
      </li>
    {/each}
  </ul>

  <ul>
    {#each presence as connection}
      <li>
        <div class="circle" style="background-color: {colors[connection]}" title={connection}></div>
      </li>
    {/each}
  </ul>

  <form on:submit|preventDefault={e => {
    const input = e.target.querySelector('input')
    const message = input.value
    input.value = ''

    messages = [...messages, { sender: clientId, text: message }]

    socket.send(JSON.stringify({ type: 'broadcast', channel: 'chat', body: { sender: clientId, text: message } }))
  }}>
    <input type="text" />
    <button>Send</button>
  </form>

  {#each Object.entries(cursors) as [sender, position]}
    {#if sender !== clientId}
      <div class="cursor" style="color: {colors[sender]}; left: {position.x}px; top: {position.y}px"></div>
    {/if}
  {/each}
</main>
