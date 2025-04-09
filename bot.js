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
    TextInputStyle 
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
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel] 
});

client.login(token);

const userSessions = {};

// Helper: Returns a random skin URL from a preset list
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

// Utility: Creates an embed message with white color (#FFFFFF) and added emojis
function createEmbed(title, description, skinUrl = defaultLogo) {
    return new EmbedBuilder()
        .setTitle(`${title} ✨`)
        .setDescription(description)
        .setColor(0xffffff)
        .setThumbnail(skinUrl)
        .setFooter({ text: 'Rylix AFK Bot ©', iconURL: defaultLogo });
}

// MONITORING WEB INTERFACE
// Displays the status of each bot session (online/offline) with extra details and emojis.
app.get('/', (req, res) => {
    let html = `<html>
    <head>
        <title>🤖 Bot Status Monitor</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background-color: #f7f7f7; }
            h1 { color: #333; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
            th { background-color: #eaeaea; }
            .online { color: green; font-weight: bold; }
            .offline { color: red; font-weight: bold; }
            img { border-radius: 4px; }
        </style>
    </head>
    <body>
        <h1>🤖 Bot Status Monitor</h1>
        <table>
            <tr>
                <th>User ID</th>
                <th>Server (Host:Port)</th>
                <th>Status</th>
                <th>Username</th>
                <th>Skin</th>
            </tr>`;
    for (const [userId, session] of Object.entries(userSessions)) {
        const status = (session.bot ? 'Online ✅' : 'Offline ❌');
        const statusClass = (session.bot ? 'online' : 'offline');
        const server = session.host && session.port ? `${session.host}:${session.port}` : 'N/A';
        const username = session.username || 'N/A';
        const skinImg = session.randomSkin ? `<img src="${session.randomSkin}" alt="skin" width="32" height="32">` : 'Default';
        html += `<tr>
            <td>${userId}</td>
            <td>${server}</td>
            <td class="${statusClass}">${status}</td>
            <td>${username}</td>
            <td>${skinImg}</td>
        </tr>`;
    }
    html += `</table>
    </body>
    </html>`;
    res.send(html);
});

app.listen(port, () => {
    console.log(`Monitoring web interface is running on port ${port} 🚀`);
});

// Discord Client Setup
client.once('ready', async () => {
    console.log(`Discord bot logged in as ${client.user.tag} 🎉`);
    await registerCommands();
});

// Registers slash commands using modern application commands
async function registerCommands() {
    const commands = [
        {
            name: 'settings',
            description: 'Save your Minecraft server connection details',
            options: [
                { name: 'host', description: 'Server host (IP/domain)', type: 3, required: true },
                { name: 'port', description: 'Server port', type: 4, required: true },
                { name: 'username', description: 'Bot username', type: 3, required: true }
            ]
        },
        { name: 'connect', description: 'Connect the bot to your saved server' },
        { name: 'disconnect', description: 'Disconnect the bot from the server' },
        {
            name: 'setcommand',
            description: 'Set a command to auto-run on connection',
            options: [{ name: 'command', description: 'Command to execute', type: 3, required: true }]
        },
        {
            name: 'setdelay',
            description: 'Set the reconnect delay in seconds',
            options: [{ name: 'delay', description: 'Delay before reconnecting', type: 4, required: true }]
        },
        { name: 'help', description: 'Display help for bot commands' },
        { name: 'panel', description: 'Open the interactive bot control panel (requires active connection)' }
    ];
    await client.application.commands.set(commands);
}

client.on('interactionCreate', async interaction => {
    try {
        // Slash Commands
        if (interaction.isChatInputCommand()) {
            const { commandName, options, user } = interaction;
            const userId = user.id;
            
            switch (commandName) {
                case 'settings':
                    handleSettingsCommand(interaction, userId, options);
                    break;
                case 'connect':
                    await handleConnectCommand(interaction, userId);
                    break;
                case 'disconnect':
                    await handleDisconnectCommand(interaction, userId);
                    break;
                case 'setcommand':
                    await handleSetCommand(interaction, userId, options);
                    break;
                case 'setdelay':
                    await handleSetDelayCommand(interaction, userId, options);
                    break;
                case 'help':
                    await handleHelpCommand(interaction);
                    break;
                case 'panel':
                    await handlePanelCommand(interaction, userId);
                    break;
                default:
                    await interaction.reply({ 
                        embeds: [createEmbed('Error', 'Unknown command 😕')], 
                        ephemeral: true 
                    });
            }
            return;
        }
        
        // Button interactions from the control panel
        if (interaction.isButton()) {
            const userId = interaction.user.id;
            const session = userSessions[userId];
            if (!session || !session.bot) {
                await interaction.reply({ 
                    embeds: [createEmbed('Error', 'No active connection found 🙁')], 
                    ephemeral: true 
                });
                return;
            }
            switch (interaction.customId) {
                case 'jump': {
                    if (session.jumpInterval) {
                        clearInterval(session.jumpInterval);
                        delete session.jumpInterval;
                        await interaction.reply({ 
                            embeds: [createEmbed('Jump', 'Jump loop stopped. 😌')], 
                            ephemeral: true 
                        });
                    } else {
                        session.jumpInterval = setInterval(() => {
                            try {
                                session.bot.jump();
                            } catch (e) {
                                console.error("Error in jump loop:", e);
                            }
                        }, 800);
                        // Auto-stop jump loop after 5 seconds if not manually stopped
                        setTimeout(() => {
                            if (session.jumpInterval) {
                                clearInterval(session.jumpInterval);
                                delete session.jumpInterval;
                            }
                        }, 5000);
                        await interaction.reply({ 
                            embeds: [createEmbed('Jump', 'Jump loop activated! 🚀')], 
                            ephemeral: true 
                        });
                    }
                    break;
                }
                case 'look_around': {
                    const randomYaw = Math.random() * (2 * Math.PI);
                    session.bot.look(randomYaw, 0, true);
                    await interaction.reply({ 
                        embeds: [createEmbed('Look Around', 'Bot is scanning its surroundings... 👀')], 
                        ephemeral: true 
                    });
                    break;
                }
                case 'disconnect_bot': {
                    session.connect = false;
                    session.bot.end();
                    delete session.bot;
                    await interaction.reply({ 
                        embeds: [createEmbed('Disconnected', 'Bot has been disconnected successfully. 👋')], 
                        ephemeral: true 
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
                    // Attack the nearest player
                    const entity = session.bot.nearestEntity(e => e.type === 'player' && e.username !== session.bot.username);
                    if (entity) {
                        session.bot.attack(entity);
                        await interaction.reply({ 
                            embeds: [createEmbed('Attack', `Attacking player: **${entity.username}** ⚔️`)], 
                            ephemeral: true 
                        });
                    } else {
                        await interaction.reply({ 
                            embeds: [createEmbed('Attack', 'No target player found to attack.')], 
                            ephemeral: true 
                        });
                    }
                    break;
                }
                default:
                    await interaction.reply({ 
                        embeds: [createEmbed('Error', 'Unknown action requested 😕')], 
                        ephemeral: true 
                    });
            }
            return;
        }
        
        // Modal submissions
        if (interaction.isModalSubmit()) {
            const userId = interaction.user.id;
            const session = userSessions[userId];
            if (!session) {
                await interaction.reply({ 
                    embeds: [createEmbed('Error', 'Session not found! Please set up your connection with `/settings`.')], 
                    ephemeral: true 
                });
                return;
            }
            if (interaction.customId === 'modal_change_name') {
                const newUsername = interaction.fields.getTextInputValue('new_username');
                session.username = newUsername;
                if (session.bot) {
                    session.bot.end();
                    delete session.bot;
                }
                if (session.connect) {
                    session.bot = createBot(session, userId);
                }
                await interaction.reply({ 
                    embeds: [createEmbed('Name Changed', `Bot username updated to **${newUsername}** and reconnected if applicable. 👍`)], 
                    ephemeral: true 
                });
            } else if (interaction.customId === 'modal_send_message') {
                const chatMessage = interaction.fields.getTextInputValue('chat_message');
                if (session.bot) {
                    session.bot.chat(chatMessage);
                    await interaction.reply({ 
                        embeds: [createEmbed('Message Sent', 'Your message was sent to the Minecraft chat! ✉️')], 
                        ephemeral: true 
                    });
                } else {
                    await interaction.reply({ 
                        embeds: [createEmbed('Error', 'Bot is not connected at the moment. Connect using `/connect`.')], 
                        ephemeral: true 
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
                ephemeral: true 
            });
        } catch (_) {
            console.error('Failed to send error reply.');
        }
    }
});

// Slash Commands Handlers
function handleSettingsCommand(interaction, userId, options) {
    const host = options.getString('host');
    const port = options.getInteger('port');
    const username = options.getString('username');
    
    // Save or update the user's server settings, always assign a random skin.
    userSessions[userId] = {
        host,
        port,
        username,
        connect: false,
        delay: 5000,  // default delay before reconnecting is 5 seconds
        randomSkin: getRandomSkinUrl()
    };
    
    interaction.reply({ 
        embeds: [createEmbed('Settings Saved', 
            `Your server connection details have been saved:\n**Host:** ${host}\n**Port:** ${port}\n**Bot Username:** ${username}\n\nYou can use \`/connect\` to activate your bot now. 👍`
        )], 
        ephemeral: true 
    });
}

async function handleConnectCommand(interaction, userId) {
    const session = userSessions[userId];
    if (!session || !session.host || !session.port || !session.username) {
        await interaction.reply({ 
            embeds: [createEmbed('Error', 'Please set your server details using `/settings` first.')], 
            ephemeral: true 
        });
        return;
    }
    
    await interaction.reply({ 
        embeds: [createEmbed('Connecting', 'Attempting to connect to your Minecraft server... ⏳')], 
        ephemeral: true 
    });
    session.connect = true;
    session.bot = createBot(session, userId);
}

async function handleDisconnectCommand(interaction, userId) {
    const session = userSessions[userId];
    if (session && session.bot) {
        session.connect = false;
        session.bot.end();
        delete session.bot;
        await interaction.reply({ 
            embeds: [createEmbed('Disconnected', 'Bot has been disconnected successfully. 👋')], 
            ephemeral: true 
        });
    } else {
        await interaction.reply({ 
            embeds: [createEmbed('Error', 'No active bot connection was found to disconnect.')], 
            ephemeral: true 
        });
    }
}

async function handleSetCommand(interaction, userId, options) {
    const command = options.getString('command');
    if (!userSessions[userId]) {
        userSessions[userId] = {};
    }
    userSessions[userId].commandOnConnect = command;
    await interaction.reply({ 
        embeds: [createEmbed('Command Set', `The command \`${command}\` will be executed when the bot connects.`)], 
        ephemeral: true 
    });
}

async function handleSetDelayCommand(interaction, userId, options) {
    const delay = options.getInteger('delay');
    if (!userSessions[userId]) {
        userSessions[userId] = {};
    }
    userSessions[userId].delay = delay * 1000;
    await interaction.reply({ 
        embeds: [createEmbed('Delay Set', `Reconnect delay updated to **${delay} seconds**. ⏰`)], 
        ephemeral: true 
    });
}

async function handleHelpCommand(interaction) {
    const helpMessage = `
**Rylix AFK Bot Help** 😄

**Setup your server:**  
\`/settings <host> <port> <username>\`

**Connect:**  
\`/connect\`

**Disconnect:**  
\`/disconnect\`

**Auto-execute a command on connect:**  
\`/setcommand <command>\`

**Set reconnect delay:**  
\`/setdelay <delay_in_seconds>\`

**Control Panel:**  
\`/panel\` - Open the panel for actions (jump, send messages, rename, and attack).

_Note: The bot connects in offline mode and gets a unique random skin on each connection!_
    `;
    await interaction.reply({ 
        embeds: [createEmbed('Help', helpMessage)] 
    });
}

async function handlePanelCommand(interaction, userId) {
    const session = userSessions[userId];
    if (!session || !session.bot) {
        await interaction.reply({ 
            embeds: [createEmbed('Error', 'No active connection found. Please connect using `/connect` first.')], 
            ephemeral: true 
        });
        return;
    }
    
    const embed = createEmbed('Bot Control Panel', 'Use the buttons below to control your bot. Enjoy! 🎮');
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('jump').setLabel('Jump 🚀').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('look_around').setLabel('Look Around 👀').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('disconnect_bot').setLabel('Disconnect 👋').setStyle(ButtonStyle.Danger)
    );
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('change_name').setLabel('Change Name 💫').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('send_message').setLabel('Send Message ✉️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('attack').setLabel('Attack ⚔️').setStyle(ButtonStyle.Danger)
    );
    await interaction.reply({ 
        embeds: [embed], 
        components: [row, row2], 
        ephemeral: true 
    });
}

// Mineflayer Bot Creation and Event Handling
function createBot(session, userId) {
    // Create the bot in offline mode and assign a random skin
    const bot = mineflayer.createBot({
        host: session.host,
        port: session.port,
        username: session.username,
        auth: 'offline'
    });
    
    // Update the session with a random skin each time we create a bot
    session.randomSkin = getRandomSkinUrl();
    let errorHandled = false;
    
    bot.on('spawn', async () => {
        console.log(`Mineflayer bot logged in as ${bot.username} 🤖`);
        try {
            const logChannel = await client.channels.fetch(logChannelId);
            if (logChannel && logChannel.isTextBased()) {
                await logChannel.send(`Connected to **${session.host}:${session.port}** as **${session.username}** 🎉`);
            }
        } catch (err) {
            console.error('Error fetching log channel:', err);
        }
        bot.chat("Hello everyone! I'm your Minecraft AFK & Anti Cheat Bot. 😄");
        if (session.commandOnConnect) {
            bot.chat(session.commandOnConnect);
        }
    });
    
    // Listen for in-game chat and log on Discord.
    bot.on('chat', async (username, message) => {
        try {
            const logChannel = await client.channels.fetch(logChannelId);
            if (logChannel && logChannel.isTextBased()) {
                await logChannel.send(`🗣 [Rylix SMP] **${username}**: ${message}`);
            }
        } catch (err) {
            console.error('Error during chat event:', err);
        }
    });
    
    bot.on('end', async () => {
        if (!errorHandled) {
            errorHandled = true;
            await handleBotDisconnection(userId, session);
        }
    });
    
    bot.on('error', async error => {
        if (!errorHandled) {
            errorHandled = true;
            await handleBotError(userId, session, error);
        }
    });
    
    return bot;
}

async function handleBotDisconnection(userId, session) {
    console.log(`Bot disconnected from ${session.host}:${session.port}`);
    try {
        if (userSessions[userId] && userSessions[userId].connect === true) {
            const logChannel = await client.channels.fetch(logChannelId);
            if (logChannel && logChannel.isTextBased()) {
                await logChannel.send(`<@${userId}>, lost connection to **${session.host}:${session.port}**. Reconnecting in ${session.delay / 1000} seconds ⏰`);
            }
            setTimeout(() => {
                if (userSessions[userId] && userSessions[userId].connect) {
                    userSessions[userId].bot = createBot(session, userId);
                }
            }, session.delay);
        }
    } catch (err) {
        console.error('Error during handleBotDisconnection:', err);
    }
}

async function handleBotError(userId, session, error) {
    console.error('Bot error:', error);
    try {
        if (userSessions[userId] && userSessions[userId].connect === true) {
            const logChannel = await client.channels.fetch(logChannelId);
            if (logChannel && logChannel.isTextBased()) {
                await logChannel.send(`<@${userId}>, encountered an error with **${session.host}:${session.port}**. Please try reconnecting with \`/connect\`.`);
            }
            userSessions[userId].connect = false;
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