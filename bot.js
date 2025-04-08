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

const token = ''; //add Token Here
const logChannelId = ''; //log channel id
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

client.once('ready', () => {
    console.log(`Discord bot logged in as ${client.user.tag} 🎉`);
    registerCommands();
});

// Slash command interactions and other interactions
client.on('interactionCreate', async interaction => {
    try {
        // Handle slash commands first
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
                    await interaction.reply({ content: 'Unknown command 😕', ephemeral: true });
            }
            return;
        }
    
        // Handle button interactions from the Discord control panel
        if (interaction.isButton()) {
            const userId = interaction.user.id;
            const session = userSessions[userId];
            if (!session || !session.bot) {
                await interaction.reply({ content: 'No active bot session found 😕', ephemeral: true });
                return;
            }
            switch (interaction.customId) {
                case 'jump': {
                    // Toggle jump loop: if already jumping, stop; if not, start jumping repeatedly
                    if (session.jumpInterval) {
                        clearInterval(session.jumpInterval);
                        delete session.jumpInterval;
                        await interaction.reply({ content: 'Stopped jump loop! 😌', ephemeral: true });
                    } else {
                        session.jumpInterval = setInterval(() => { 
                            try {
                                session.bot.jump();
                            } catch(e) {
                                console.error("Error during jump loop:", e);
                            }
                        }, 800);
                        // Auto-stop the jump loop after 5 seconds
                        setTimeout(() => { 
                            if(session.jumpInterval) {
                                clearInterval(session.jumpInterval);
                                delete session.jumpInterval;
                            }
                        }, 5000);
                        await interaction.reply({ content: 'Bot is jumping repeatedly! 🚀', ephemeral: true });
                    }
                    break;
                }
                case 'look_around': {
                    // Rotate to a random yaw between 0 and 2π radians
                    const randomYaw = Math.random() * (2 * Math.PI);
                    session.bot.look(randomYaw, 0, true);
                    await interaction.reply({ content: 'Bot is looking around... 👀', ephemeral: true });
                    break;
                }
                case 'disconnect_bot':
                    session.connect = false;
                    session.bot.end();
                    delete session.bot;
                    await interaction.reply({ content: 'Bot disconnected! 👋', ephemeral: true });
                    break;
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
                        .setLabel('Enter chat message')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('Type your message here...')
                        .setRequired(true);
                    
                    const actionRow = new ActionRowBuilder().addComponents(messageInput);
                    modal.addComponents(actionRow);
    
                    await interaction.showModal(modal);
                    break;
                }
                default:
                    await interaction.reply({ content: 'Unknown action 😕', ephemeral: true });
            }
            return;
        }
        
        // Handle modal submissions
        if (interaction.isModalSubmit()) {
            const userId = interaction.user.id;
            const session = userSessions[userId];
            if (!session) {
                await interaction.reply({ content: 'Session not found 😕', ephemeral: true });
                return;
            }
            if (interaction.customId === 'modal_change_name') {
                const newUsername = interaction.fields.getTextInputValue('new_username');
                // Save new username in settings and reconnect if necessary
                session.username = newUsername;
                if (session.bot) {
                    session.bot.end();
                    delete session.bot;
                }
                if (session.connect) {
                    session.bot = createBot(session, userId);
                }
                await interaction.reply({ content: `Bot username changed to **${newUsername}** and reconnected (if online). 👍`, ephemeral: true });
            } else if (interaction.customId === 'modal_send_message') {
                const chatMessage = interaction.fields.getTextInputValue('chat_message');
                if (session.bot) {
                    session.bot.chat(chatMessage);
                    await interaction.reply({ content: 'Message sent! ✉️', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'Bot is not connected 😕', ephemeral: true });
                }
            }
            return;
        }
    } catch (error) {
        console.error('Interaction error:', error);
        try {
            await interaction.reply({ content: 'An error occurred while handling your interaction 😥', ephemeral: true });
        } catch (_) {
            console.error('Failed to send error reply.');
        }
    }
});

// Slash command: /settings
function handleSettingsCommand(interaction, userId, options) {
    const host = options.getString('host');
    const port = options.getInteger('port');
    const username = options.getString('username');

    userSessions[userId] = {
        host,
        port,
        username,
        connect: false,
        delay: 5000  
    };

    interaction.reply(`Saved connection settings: **${host}:${port}** with username **${username}** 😊`);
}

// Slash command: /connect
async function handleConnectCommand(interaction, userId) {
    const session = userSessions[userId];

    if (!session || !session.host || !session.port || !session.username) {
        await interaction.reply('You need to set up the settings first with the `/settings` command 😕');
        return;
    }

    await interaction.reply('Trying to connect to the server... ⏳');

    session.connect = true;
    session.bot = createBot(session, userId);
}

// Slash command: /disconnect
async function handleDisconnectCommand(interaction, userId) {
    const session = userSessions[userId];

    if (session && session.bot) {
        session.connect = false;
        session.bot.end();
        delete session.bot;
        await interaction.reply('Disconnected from the server. 👋');
    } else {
        await interaction.reply('I was not connected to the server 😕');
    }
}

// Slash command: /setcommand
async function handleSetCommand(interaction, userId, options) {
    const command = options.getString('command');

    if (!userSessions[userId]) {
        userSessions[userId] = {};
    }

    userSessions[userId].commandOnConnect = command;
    await interaction.reply({ content: `I will execute the command \`${command}\` after connecting to the server. 👍`, ephemeral: true });
}

// Slash command: /setdelay
async function handleSetDelayCommand(interaction, userId, options) {
    const delay = options.getInteger('delay');

    if (!userSessions[userId]) {
        userSessions[userId] = {};
    }

    userSessions[userId].delay = delay * 1000;
    await interaction.reply({ content: `I will now wait ${delay} seconds before reconnecting to the server. ⏰`});
}

// Slash command: /help
async function handleHelpCommand(interaction) {
    const helpMessage = `
**Hello!** 😄

I can stand in for you on the server while you handle your tasks.
Before you start, set up the server connection settings using:
\`/settings <host> <port> <username>\`
(Note: I only connect to servers **1.18 to 1.20.4 with cracked versions**.)

To connect, use \`/connect\`, and to disconnect use \`/disconnect\`.
If you want me to execute a command on join (for passwords or the like), use:
\`/setcommand <command>\`
If I get disconnected, I'll try to reconnect after 5 seconds; to adjust this delay use:
\`/setdelay <delay_in_seconds>\`.

You can also open my control panel with \`/panel\` for in-game commands!
    `;
    await interaction.reply({ content: helpMessage });
}

// Slash command: /panel - open the bot control panel (only if connected)
async function handlePanelCommand(interaction, userId) {
    const session = userSessions[userId];
    if (!session || !session.bot) {
        await interaction.reply({ content: 'You must be connected to the server to use the panel 😕', ephemeral: true });
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle('Rylix AFK Bot Control Panel')
        .setDescription('Use the buttons below to control your bot. Enjoy! 🎮')
        .setColor(0x00AE86)
        .setThumbnail('https://cdn.imrishmika.site/rylix/RYLIX-white.png');
    
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('jump').setLabel('Jump 🚀').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('look_around').setLabel('Look Around 👀').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('disconnect_bot').setLabel('Disconnect 👋').setStyle(ButtonStyle.Danger)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('change_name').setLabel('Change Name 💫').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('send_message').setLabel('Send Message ✉️').setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row, row2], ephemeral: true });
}

// Create the Mineflayer bot and define its event handlers, including listening to every chat command and message
function createBot(session, userId) {
    const bot = mineflayer.createBot({
        host: session.host,
        port: session.port,
        username: session.username,
        auth: 'offline'
    });

    let errorHandled = false;

    bot.on('spawn', async () => {
        console.log(`Mineflayer bot logged in as ${bot.username} 🤖`);
        try {
            const logChannel = await client.channels.fetch(logChannelId);
            if (logChannel && logChannel.isTextBased()) {
                await logChannel.send(`Connected to the server \`${session.host}:${session.port}\` as \`${session.username}\` 🎉`);
            }
        } catch (err) {
            console.error('Error fetching log channel:', err);
        }
        // Send a fun in-game chat message when the bot spawns
        bot.chat("Rylix AFK 🤖");
    
        if (session.commandOnConnect) {
            bot.chat(session.commandOnConnect);
        }
    });

    // Listen to every chat message and command in the Minecraft server
    bot.on('chat', async (username, message) => {
        try {
            // Log every chat message from the server to the designated Discord channel
            const logChannel = await client.channels.fetch(logChannelId);
            if (logChannel && logChannel.isTextBased()) {
                await logChannel.send(`🗣 [MC] **${username}**: ${message}`);
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
                await logChannel.send(`<@${userId}>, I was disconnected from \`${session.host}:${session.port}\`. I will try to reconnect in ${session.delay / 1000} seconds ⏰.`);
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
                await logChannel.send(`<@${userId}>, I encountered an error connecting to \`${session.host}:${session.port}\`. Please try again with \`/connect\` 😥.`);
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

function registerCommands() {
    const commands = [
        {
            name: 'settings',
            description: 'Set connection settings',
            options: [
                { name: 'host', description: 'Server host', type: 3, required: true },
                { name: 'port', description: 'Server port', type: 4, required: true },
                { name: 'username', description: 'Username', type: 3, required: true }
            ]
        },
        { name: 'connect', description: 'Connect to the server' },
        { name: 'disconnect', description: 'Disconnect from the server' },
        {
            name: 'setcommand',
            description: 'Set command to execute upon connection',
            options: [{ name: 'command', description: 'Command to execute', type: 3, required: true }]
        },
        {
            name: 'setdelay',
            description: 'Set delay before reconnecting',
            options: [{ name: 'delay', description: 'Delay in seconds', type: 4, required: true }]
        },
        { name: 'help', description: 'Get command help' },
        { name: 'panel', description: 'Open bot control panel (for AFK bot owner)' }
    ];
    client.application.commands.set(commands);
}
