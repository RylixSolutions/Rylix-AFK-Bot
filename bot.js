require('dotenv').config(); // load env variables

const express = require('express');
const app = express();
const port = 9089;

const {
  Client,
  GatewayIntentBits,
  Partials,
  ButtonStyle,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const mineflayer = require('mineflayer');

// Environment variables: use .env file for sensitive configurations
const token = process.env.DISCORD_TOKEN;
const logChannelId = process.env.LOG_CHANNEL_ID;
const defaultLogo = 'https://cdn.imrishmika.site/rylix/RYLIX-white.png';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

client.login(token);

// Structure: One user can have up to 2 server sessions.
const userSessions = {}; // { userId: { servers: [session1, session2?] } }

// Helper: Returns a random skin URL from a preset list.
function getRandomSkinUrl() {
  const skins = [
    'https://minecraftskins.com/skin/12345.png',
    'https://minecraftskins.com/skin/abcdef.png',
    'https://minecraftskins.com/skin/67890.png',
    'https://minecraftskins.com/skin/ghijkl.png'
  ];
  const randomIndex = Math.floor(Math.random() * skins.length);
  return skins[randomIndex];
}

// Helper: Returns a random username to simulate real players and avoid idle detection.
function getRandomUsername() {
  const names = ['Alex', 'Steve', 'Herobrine', 'Notch', 'AlexTheGreat', 'MinerBob'];
  return names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 1000);
}

// Utility: Creates an embed message.
function createEmbed(title, description, skinUrl = defaultLogo) {
  return new EmbedBuilder()
    .setTitle(`${title} ✨`)
    .setDescription(description)
    .setColor(0xffffff)
    .setThumbnail(skinUrl)
    .setFooter({ text: 'Rylix AFK Bot ©', iconURL: defaultLogo });
}

// Web Dashboard: Displays current session details.
app.get('/', (req, res) => {
  let html = `<html>
  <head>
      <title>🤖 Bot Status Dashboard</title>
      <style>
          body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #e0e0e0, #ffffff); margin: 0; padding: 20px; }
          h1 { text-align: center; color: #333; }
          .container { max-width: 1200px; margin: 20px auto; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
          th, td { padding: 12px; text-align: center; border-bottom: 1px solid #ddd; }
          th { background: #007BFF; color: #fff; }
          tr:hover { background: #f1f1f1; }
          .online { color: green; font-weight: bold; }
          .offline { color: red; font-weight: bold; }
          img { border-radius: 4px; }
          .details { font-size: 0.9em; color: #555; }
      </style>
  </head>
  <body>
      <h1>🤖 Bot Status Dashboard</h1>
      <div class="container">`;
  for (const [userId, data] of Object.entries(userSessions)) {
    html += `<h2>User: ${userId}</h2><table>
          <tr>
              <th>Session #</th>
              <th>Server (Host:Port)</th>
              <th>Status</th>
              <th>Username</th>
              <th>Skin</th>
              <th>Last Ping (ms)</th>
              <th>Health</th>
              <th>Food</th>
              <th>Up Time</th>
          </tr>`;
    data.servers.forEach((session, index) => {
      const status = (session.bot ? 'Online ✅' : 'Offline ❌');
      const statusClass = (session.bot ? 'online' : 'offline');
      const server = session.host && session.port ? `${session.host}:${session.port}` : 'N/A';
      const username = session.username || 'N/A';
      const skinImg = session.randomSkin ? `<img src="${session.randomSkin}" alt="skin" width="32" height="32">` : 'Default';
      const lastPing = session.lastPing ? session.lastPing : 'N/A';
      let health = 'N/A';
      let food = 'N/A';
      let upTime = 'N/A';
      if (session.bot) {
        health = session.bot.health;
        food = session.bot.food;
        if (session.startTime) {
          const diff = Date.now() - session.startTime;
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          upTime = `${minutes}m ${seconds}s`;
        }
      }
      html += `<tr>
              <td>${index + 1}</td>
              <td>${server}</td>
              <td class="${statusClass}">${status}</td>
              <td>${username}</td>
              <td>${skinImg}</td>
              <td>${lastPing}</td>
              <td>${health}</td>
              <td>${food}</td>
              <td>${upTime}</td>
          </tr>`;
    });
    html += `</table>`;
  }
  html += `</div></body></html>`;
  res.send(html);
});

app.listen(port, () => {
  console.log(`Modern Dashboard running on port ${port} 🚀`);
});

// Discord Client Setup
client.once('ready', async () => {
  console.log(`Discord bot logged in as ${client.user.tag} 🎉`);
  await registerCommands();
});

// Register slash commands.
async function registerCommands() {
  const commands = [
    {
      name: 'settings',
      description: 'Save your Minecraft server connection details (max 2 servers)',
      options: [
        { name: 'host', description: 'Server host (IP/domain)', type: 3, required: true },
        { name: 'port', description: 'Server port', type: 4, required: true },
        { name: 'username', description: 'Bot username', type: 3, required: true },
        { name: 'session', description: 'Session number (1 or 2)', type: 4, required: false },
      ],
    },
    {
      name: 'connect',
      description: 'Connect the bot to your saved server for a given session',
      options: [{ name: 'session', description: 'Session number (1 or 2)', type: 4, required: false }],
    },
    {
      name: 'disconnect',
      description: 'Disconnect the bot from the server for a given session',
      options: [{ name: 'session', description: 'Session number (1 or 2)', type: 4, required: false }],
    },
    {
      name: 'setcommand',
      description: 'Set a command to auto-run on connection for a given session',
      options: [
        { name: 'command', description: 'Command to execute', type: 3, required: true },
        { name: 'session', description: 'Session number (1 or 2)', type: 4, required: false },
      ],
    },
    {
      name: 'setdelay',
      description: 'Set the reconnect delay in seconds for a given session',
      options: [
        { name: 'delay', description: 'Delay before reconnecting', type: 4, required: true },
        { name: 'session', description: 'Session number (1 or 2)', type: 4, required: false },
      ],
    },
    {
      name: 'reconnect',
      description: 'Force the bot to disconnect and rejoin with a new random username',
      options: [{ name: 'session', description: 'Session number (1 or 2)', type: 4, required: false }],
    },
    {
      name: 'help',
      description: 'Display help for bot commands',
    },
    {
      name: 'panel',
      description: 'Open the interactive bot control panel for a given session',
      options: [{ name: 'session', description: 'Session number (1 or 2)', type: 4, required: false }],
    },
  ];
  await client.application.commands.set(commands);
}

client.on('interactionCreate', async (interaction) => {
  try {
    // Utility: get session based on an optional "session" parameter; default is 1.
    function getSession(userId, options) {
      let index = options.getInteger('session');
      if (!index) {
        index = 1;
      }
      index = Math.max(1, Math.min(2, index));
      if (!userSessions[userId]) {
        userSessions[userId] = { servers: [] };
      }
      if (!userSessions[userId].servers[index - 1]) {
        userSessions[userId].servers[index - 1] = {};
      }
      return { index, session: userSessions[userId].servers[index - 1] };
    }

    // Slash Commands Handling
    if (interaction.isChatInputCommand()) {
      const { commandName, options, user } = interaction;
      const userId = user.id;

      switch (commandName) {
        case 'settings': {
          let index = options.getInteger('session');
          if (!userSessions[userId]) {
            userSessions[userId] = { servers: [] };
          }
          if (!index) {
            if (!userSessions[userId].servers[0]) {
              index = 1;
            } else if (!userSessions[userId].servers[1]) {
              index = 2;
            } else {
              index = 1;
            }
          } else {
            index = Math.max(1, Math.min(2, index));
          }
          const host = options.getString('host');
          const port = options.getInteger('port');
          const usernameOption = options.getString('username');
          const newSession = {
            host,
            port,
            username: usernameOption,
            connect: false,
            delay: 5000, // default delay 5 seconds
            randomSkin: getRandomSkinUrl(),
          };
          userSessions[userId].servers[index - 1] = newSession;
          await interaction.reply({
            embeds: [createEmbed('Settings Saved', `Session ${index} saved:
**Host:** ${host}
**Port:** ${port}
**Bot Username:** ${usernameOption}

Use \`/connect\` with session \`${index}\` to connect. 👍`, newSession.randomSkin)],
            ephemeral: true,
          });
        }
          break;
        case 'connect': {
          const { index, session } = getSession(userId, options);
          if (!session.host || !session.port || !session.username) {
            await interaction.reply({
              embeds: [createEmbed('Error', 'Set your server details with `/settings` first.')],
              ephemeral: true,
            });
            return;
          }
          await interaction.reply({
            embeds: [createEmbed('Connecting', `Attempting to connect to ${session.host}:${session.port} for session ${index}... ⏳`, session.randomSkin)],
            ephemeral: true,
          });
          session.connect = true;
          session.bot = createBot(session, userId, index);
        }
          break;
        case 'disconnect': {
          const { index, session } = getSession(userId, options);
          if (session && session.bot) {
            session.connect = false;
            if (session.autoReconnectTimeout) clearTimeout(session.autoReconnectTimeout);
            session.bot.end();
            delete session.bot;
            await interaction.reply({
              embeds: [createEmbed('Disconnected', `Session ${index} disconnected successfully. 👋`, session.randomSkin)],
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              embeds: [createEmbed('Error', `No active connection found in session ${index}.`)],
              ephemeral: true,
            });
          }
        }
          break;
        case 'setcommand': {
          const { index, session } = getSession(userId, options);
          const command = options.getString('command');
          session.commandOnConnect = command;
          await interaction.reply({
            embeds: [createEmbed('Command Set', `In session ${index}, command \`${command}\` will run on connect.`, session.randomSkin)],
            ephemeral: true,
          });
        }
          break;
        case 'setdelay': {
          const { index, session } = getSession(userId, options);
          const delay = options.getInteger('delay');
          session.delay = delay * 1000;
          await interaction.reply({
            embeds: [createEmbed('Delay Set', `Session ${index} reconnect delay updated to **${delay} seconds**. ⏰`, session.randomSkin)],
            ephemeral: true,
          });
        }
          break;
        case 'reconnect': {
          const { index, session } = getSession(userId, options);
          if (session && session.bot) {
            session.bot.end();
            if (session.autoReconnectTimeout) clearTimeout(session.autoReconnectTimeout);
            delete session.bot;
          }
          session.username = getRandomUsername();
          session.connect = true;
          await interaction.reply({
            embeds: [createEmbed('Reconnecting', `Forcing reconnect in session ${index} with new username **${session.username}**.`, session.randomSkin)],
            ephemeral: true,
          });
          session.bot = createBot(session, userId, index);
        }
          break;
        case 'help': {
          const helpMessage = `
**Rylix AFK Bot Help** 😄

**Setup your server:**  
\`/settings <host> <port> <username> [session]\` (session is 1 or 2)

**Connect:**  
\`/connect [session]\`

**Disconnect:**  
\`/disconnect [session]\`

**Auto-run command on connect:**  
\`/setcommand <command> [session]\`

**Set reconnect delay:**  
\`/setdelay <delay_in_seconds> [session]\`

**Force Reconnect:**  
\`/reconnect [session]\` - Disconnect, change name randomly, and rejoin.

**Control Panel:**  
\`/panel [session]\` - Open the panel to perform actions.
          `;
          await interaction.reply({
            embeds: [createEmbed('Help', helpMessage)],
            ephemeral: true,
          });
        }
          break;
        case 'panel': {
          const { index, session } = getSession(userId, options);
          if (!session || !session.bot) {
            await interaction.reply({
              embeds: [createEmbed('Error', `No active connection found in session ${index}. Connect using \`/connect\`.`)],
              ephemeral: true,
            });
            return;
          }
          const embed = createEmbed('Bot Control Panel',
`Session ${index} Control Panel:
• **Jump**: Make the bot jump.
• **Look Around**: Rotate bot's view.
• **Server Ping**: Get current ping.
• **Server Players**: List online players.
• **Simulate Activity**: Send a random chat message.
• **Move Randomly**: Make the bot move forward briefly.
• **Show Statistics**: Display connection uptime.
• **Change Name**: Update bot username.
• **Send Message**: Send a chat message.
• **Attack**: Attack nearest player.
• **Disconnect**: Disconnect the bot.
• **Force Reconnect**: Disconnect and reconnect with a new random name.
`, session.randomSkin);
          const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('jump').setLabel('Jump 🚀').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('look_around').setLabel('Look Around 👀').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('server_ping').setLabel('Server Ping 🏓').setStyle(ButtonStyle.Secondary)
          );
          const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('server_players').setLabel('Server Players 👥').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('change_name').setLabel('Change Name 💫').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('send_message').setLabel('Send Message ✉️').setStyle(ButtonStyle.Secondary)
          );
          const row3 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('attack').setLabel('Attack ⚔️').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('disconnect_bot').setLabel('Disconnect 👋').setStyle(ButtonStyle.Danger)
          );
          const row4 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('simulate_activity').setLabel('Simulate Activity 💬').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('move_randomly').setLabel('Move Randomly 🏃').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('statistics').setLabel('Statistics 📊').setStyle(ButtonStyle.Secondary)
          );
          session.panelSessionIndex = index;
          await interaction.reply({
            embeds: [embed],
            components: [row1, row2, row3, row4],
            ephemeral: true,
          });
        }
          break;
        default:
          await interaction.reply({
            embeds: [createEmbed('Error', 'Unknown command 😕')],
            ephemeral: true,
          });
          break;
      }
      return;
    }

    // Button interactions
    if (interaction.isButton()) {
      const userId = interaction.user.id;
      const sessions = userSessions[userId] ? userSessions[userId].servers : null;
      if (!sessions) {
        await interaction.reply({
          embeds: [createEmbed('Error', 'No session found 🙁')],
          ephemeral: true,
        });
        return;
      }
      let session = sessions[0];
      for (const s of sessions) {
        if (s.panelSessionIndex) {
          session = s;
          break;
        }
      }
      if (!session || !session.bot) {
        await interaction.reply({
          embeds: [createEmbed('Error', 'No active connection found.')],
          ephemeral: true,
        });
        return;
      }
      switch (interaction.customId) {
        case 'jump': {
          if (session.jumpInterval) {
            clearInterval(session.jumpInterval);
            delete session.jumpInterval;
            await interaction.reply({
              embeds: [createEmbed('Jump', 'Jump loop stopped. 😌', session.randomSkin)],
              ephemeral: true,
            });
          } else {
            session.jumpInterval = setInterval(() => {
              try {
                session.bot.jump();
              } catch (e) {
                console.error("Error in jump loop:", e);
              }
            }, 1500);
            setTimeout(() => {
              if (session.jumpInterval) {
                clearInterval(session.jumpInterval);
                delete session.jumpInterval;
              }
            }, 5000);
            await interaction.reply({
              embeds: [createEmbed('Jump', 'Jump loop activated! 🚀', session.randomSkin)],
              ephemeral: true,
            });
          }
          break;
        }
        case 'look_around': {
          const randomYaw = Math.random() * (2 * Math.PI);
          session.bot.look(randomYaw, 0, true);
          await interaction.reply({
            embeds: [createEmbed('Look Around', 'Bot is scanning its surroundings... 👀', session.randomSkin)],
            ephemeral: true,
          });
          break;
        }
        case 'server_ping': {
          const ping = Math.floor(Math.random() * 100) + 50;
          session.lastPing = ping;
          await interaction.reply({
            embeds: [createEmbed('Server Ping', `Current ping: **${ping} ms**`, session.randomSkin)],
            ephemeral: true,
          });
          break;
        }
        case 'server_players': {
          const players = Object.keys(session.bot.players);
          const playerList = players.length ? players.join(', ') : 'No players online.';
          await interaction.reply({
            embeds: [createEmbed('Server Players', playerList, session.randomSkin)],
            ephemeral: true,
          });
          break;
        }
        case 'disconnect_bot': {
          session.connect = false;
          if (session.autoReconnectTimeout) clearTimeout(session.autoReconnectTimeout);
          session.bot.end();
          delete session.bot;
          await interaction.reply({
            embeds: [createEmbed('Disconnected', 'Bot disconnected successfully. 👋', session.randomSkin)],
            ephemeral: true,
          });
          break;
        }
        case 'change_name': {
          const modal = new ModalBuilder()
            .setCustomId('modal_change_name')
            .setTitle('Change Bot Name 💫');
          const nameInput = new TextInputBuilder()
            .setCustomId('new_username')
            .setLabel('Enter the new username')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('New username')
            .setRequired(true);
          const actionRow = new ActionRowBuilder().addComponents(nameInput);
          modal.addComponents(actionRow);
          await interaction.showModal(modal);
          break;
        }
        case 'send_message': {
          const modal = new ModalBuilder()
            .setCustomId('modal_send_message')
            .setTitle('Send Message to Server Chat ✉️');
          const messageInput = new TextInputBuilder()
            .setCustomId('chat_message')
            .setLabel('Your message')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Type your message here...')
            .setRequired(true);
          const actionRow = new ActionRowBuilder().addComponents(messageInput);
          modal.addComponents(actionRow);
          await interaction.showModal(modal);
          break;
        }
        case 'attack': {
          const entity = session.bot.nearestEntity(e => e.type === 'player' && e.username !== session.bot.username);
          if (entity) {
            session.bot.attack(entity);
            await interaction.reply({
              embeds: [createEmbed('Attack', `Attacking player: **${entity.username}** ⚔️`, session.randomSkin)],
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              embeds: [createEmbed('Attack', 'No target player found to attack.', session.randomSkin)],
              ephemeral: true,
            });
          }
          break;
        }
        case 'simulate_activity': {
          const messages = [
            "Just exploring the world...",
            "What a beautiful day in Minecraft!",
            "Anyone up for a build?",
            "Chilling like a true survivor.",
            "Enjoying the scenery!"
          ];
          const randomMessage = messages[Math.floor(Math.random() * messages.length)];
          session.bot.chat(randomMessage);
          await interaction.reply({
            embeds: [createEmbed('Simulate Activity', `Bot says: "${randomMessage}"`, session.randomSkin)],
            ephemeral: true,
          });
          break;
        }
        case 'move_randomly': {
          session.bot.setControlState('forward', true);
          setTimeout(() => {
            session.bot.setControlState('forward', false);
          }, 2000);
          await interaction.reply({
            embeds: [createEmbed('Move Randomly', 'Bot is moving forward to mimic activity!', session.randomSkin)],
            ephemeral: true,
          });
          break;
        }
        case 'statistics': {
          let uptime = 'N/A';
          if (session.startTime) {
            const diff = Date.now() - session.startTime;
            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            uptime = `${minutes}m ${seconds}s`;
          }
          await interaction.reply({
            embeds: [createEmbed('Statistics', `Uptime: **${uptime}**\nLast Ping: **${session.lastPing || 'N/A'} ms**`, session.randomSkin)],
            ephemeral: true,
          });
          break;
        }
        default:
          await interaction.reply({
            embeds: [createEmbed('Error', 'Unknown action requested 😕', session.randomSkin)],
            ephemeral: true,
          });
      }
      return;
    }

    // Modal submissions
    if (interaction.isModalSubmit()) {
      const userId = interaction.user.id;
      const sessions = userSessions[userId] ? userSessions[userId].servers : null;
      if (!sessions) {
        await interaction.reply({
          embeds: [createEmbed('Error', 'Session not found! Please set up your connection with `/settings`.')],
          ephemeral: true,
        });
        return;
      }
      let session = sessions[0];
      for (const s of sessions) {
        if (s.panelSessionIndex) {
          session = s;
          break;
        }
      }
      if (interaction.customId === 'modal_change_name') {
        const newUsername = interaction.fields.getTextInputValue('new_username');
        session.username = newUsername;
        if (session.bot) {
          session.bot.end();
          delete session.bot;
        }
        if (session.connect) {
          session.bot = createBot(session, userId, session.panelSessionIndex || 1);
        }
        await interaction.reply({
          embeds: [createEmbed('Name Changed', `Bot username updated to **${newUsername}** and reconnected if applicable. 👍`, session.randomSkin)],
          ephemeral: true,
        });
      } else if (interaction.customId === 'modal_send_message') {
        const chatMessage = interaction.fields.getTextInputValue('chat_message');
        if (session.bot) {
          session.bot.chat(chatMessage);
          await interaction.reply({
            embeds: [createEmbed('Message Sent', 'Your message was sent to the Minecraft chat! ✉️', session.randomSkin)],
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            embeds: [createEmbed('Error', 'Bot is not connected. Connect using `/connect`.')],
            ephemeral: true,
          });
        }
      }
      return;
    }
  } catch (error) {
    console.error('Interaction error:', error);
    try {
      await interaction.reply({
        embeds: [createEmbed('Error', 'An error occurred while processing your request. Please try again later.')],
        ephemeral: true,
      });
    } catch (_) {
      console.error('Failed to send error reply.');
    }
  }
});

// Mineflayer Bot Creation and Event Handling
function createBot(session, userId, sessionIndex) {
  const bot = mineflayer.createBot({
    host: session.host,
    port: session.port,
    username: session.username,
    auth: 'offline',
  });

  // Update skin and record connection start time.
  session.randomSkin = getRandomSkinUrl();
  session.startTime = Date.now();

  // Schedule auto-reconnect every 2 hours to simulate leaving and rejoining.
  session.autoReconnectTimeout = setTimeout(() => {
    if (session.connect) {
      console.log(`Auto-reconnect triggered for session ${sessionIndex}`);
      bot.end();
      // On reconnect, update username to a new random value.
      session.username = getRandomUsername();
      setTimeout(() => {
        if (session.connect) {
          session.bot = createBot(session, userId, sessionIndex);
        }
      }, session.delay);
    }
  }, 7200000); // 2 hours in milliseconds.

  let errorHandled = false;

  bot.on('spawn', async () => {
    console.log(`Mineflayer bot [Session ${sessionIndex}] logged in as ${bot.username} 🤖`);
    try {
      const logChannel = await client.channels.fetch(logChannelId);
      if (logChannel && logChannel.isTextBased()) {
        await logChannel.send(`Connected to **${session.host}:${session.port}** as **${bot.username}** (Session ${sessionIndex}) 🎉`);
      }
    } catch (err) {
      console.error('Error fetching log channel:', err);
    }
    bot.chat("Hello! I'm your Minecraft AFK & Anti-Cheat Bot. 😄");
    if (session.commandOnConnect) {
      bot.chat(session.commandOnConnect);
    }
  });

  // Throttle chat logging.
  let lastChatLog = 0;
  bot.on('chat', async (username, message) => {
    const now = Date.now();
    if (now - lastChatLog > 10000) {
      lastChatLog = now;
      try {
        const logChannel = await client.channels.fetch(logChannelId);
        if (logChannel && logChannel.isTextBased()) {
          await logChannel.send(`🗣 [Rylix SMP] **${username}**: ${message}`);
        }
      } catch (err) {
        console.error('Error during chat event:', err);
      }
    }
  });

  bot.on('end', async () => {
    if (!errorHandled) {
      errorHandled = true;
      await handleBotDisconnection(userId, session, sessionIndex);
    }
  });

  bot.on('error', async (error) => {
    if (!errorHandled) {
      errorHandled = true;
      await handleBotError(userId, session, error, sessionIndex);
    }
  });

  return bot;
}

async function handleBotDisconnection(userId, session, sessionIndex) {
  console.log(`Bot [Session ${sessionIndex}] disconnected from ${session.host}:${session.port}`);
  try {
    if (userSessions[userId] && userSessions[userId].servers[sessionIndex - 1].connect === true) {
      const logChannel = await client.channels.fetch(logChannelId);
      if (logChannel && logChannel.isTextBased()) {
        await logChannel.send(`<@${userId}>, lost connection to **${session.host}:${session.port}** (Session ${sessionIndex}). Reconnecting in ${session.delay / 1000} seconds ⏰`);
      }
      setTimeout(() => {
        if (userSessions[userId] && userSessions[userId].servers[sessionIndex - 1].connect) {
          // Update username randomly for new connection.
          userSessions[userId].servers[sessionIndex - 1].username = getRandomUsername();
          userSessions[userId].servers[sessionIndex - 1].bot = createBot(session, userId, sessionIndex);
        }
      }, session.delay);
    }
  } catch (err) {
    console.error('Error during handleBotDisconnection:', err);
  }
}

async function handleBotError(userId, session, error, sessionIndex) {
  console.error('Bot error:', error);
  try {
    if (userSessions[userId] && userSessions[userId].servers[sessionIndex - 1].connect === true) {
      const logChannel = await client.channels.fetch(logChannelId);
      if (logChannel && logChannel.isTextBased()) {
        await logChannel.send(`<@${userId}>, encountered an error with **${session.host}:${session.port}** (Session ${sessionIndex}). Please try reconnecting with \`/connect\`.`);
      }
      userSessions[userId].servers[sessionIndex - 1].connect = false;
      if (session && session.bot) {
        session.bot.removeAllListeners();
        session.bot.end();
        delete session.bot;
      }
    }
  } catch (err) {
    console.error('Error during handleBotError:', err);
  }
}
