require('dotenv').config(); // load env variables

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
const rylixLogo = 'https://cdn.imrishmika.site/rylix/RYLIX-white.png';

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

client.once('ready', async () => {
    console.log(`Discord bot logged in as ${client.user.tag} 🎉`);
    await registerCommands();
});

// Registers slash commands using modern discord.js application commands
async function registerCommands() {
    const commands = [
        {
            name: 'settings',
            description: 'Add and save a Minecraft server connection',
            options: [
                { name: 'host', description: 'Server host (IP/domain)', type: 3, required: true },
                { name: 'port', description: 'Server port', type: 4, required: true },
                { name: 'username', description: 'Username for the bot', type: 3, required: true }
            ]
        },
        { name: 'connect', description: 'Connect to the saved server' },
        { name: 'disconnect', description: 'Disconnect the bot from the server' },
        {
            name: 'setcommand',
            description: 'Set a command to automatically execute on connection',
            options: [{ name: 'command', description: 'The command to be executed', type: 3, required: true }]
        },
        {
            name: 'setdelay',
            description: 'Set reconnect delay (in seconds)',
            options: [{ name: 'delay', description: 'Delay in seconds before reconnecting', type: 4, required: true }]
        },
        { name: 'help', description: 'Get help with the bot commands' },
        { name: 'panel', description: 'Open the bot control panel (requires active connection)' }
    ];
    await client.application.commands.set(commands);
}

// Utility: Create a modern embed with Rylix logo
function createEmbed(title, description, color = 0x00AE86){
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setThumbnail(rylixLogo)
        .setFooter({ text: 'Rylix AFK Bot', iconURL: rylixLogo });
}

client.on('interactionCreate', async interaction => {
    try {
        // Slash Commands
        if(interaction.isChatInputCommand()){
            const { commandName, options, user } = interaction;
            const userId = user.id;
            
            switch(commandName) {
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
                    await interaction.reply({ embeds: [createEmbed('Error', 'Unknown command 😕')], ephemeral: true });
            }
            return;
        }
        
        // Button interactions from the control panel
        if(interaction.isButton()){
            const userId = interaction.user.id;
            const session = userSessions[userId];
            if(!session || !session.bot){
                await interaction.reply({ embeds: [createEmbed('Error', 'No active bot connection found.')], ephemeral: true });
                return;
            }
            switch(interaction.customId) {
                case 'jump': {
                    // Enhanced jump command: Toggle jump loop on button press
                    if(session.manualJumpInterval) {
                        clearInterval(session.manualJumpInterval);
                        delete session.manualJumpInterval;
                        await interaction.reply({ embeds: [createEmbed('Jump', 'Stopped manual jump loop! 😌')], ephemeral: true });
                    } else {
                        session.manualJumpInterval = setInterval(() => {
                            try {
                                session.bot.jump();
                            } catch(e){
                                console.error("Error in manual jump loop:", e);
                            }
                        }, 800);
                        // auto-stop jump loop after 5 seconds if not manually stopped
                        setTimeout(() => {
                            if(session.manualJumpInterval) {
                                clearInterval(session.manualJumpInterval);
                                delete session.manualJumpInterval;
                            }
                        }, 5000);
                        await interaction.reply({ embeds: [createEmbed('Jump', 'Bot is jumping repeatedly! 🚀')], ephemeral: true });
                    }
                    break;
                }
                case 'look_around': {
                    const randomYaw = Math.random() * (2 * Math.PI);
                    session.bot.look(randomYaw, session.bot.entity.pitch, true);
                    await interaction.reply({ embeds: [createEmbed('Look Around', 'Bot is looking around... 👀')], ephemeral: true });
                    break;
                }
                case 'disconnect_bot': {
                    session.connect = false;
                    session.bot.end();
                    delete session.bot;
                    await interaction.reply({ embeds: [createEmbed('Disconnect', 'Bot disconnected! 👋')], ephemeral: true });
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
                        .setLabel('Enter your message')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('Type your message here...')
                        .setRequired(true);
                    
                    const actionRow = new ActionRowBuilder().addComponents(messageInput);
                    modal.addComponents(actionRow);
                    await interaction.showModal(modal);
                    break;
                }
                case 'attack': {
                    // New feature: Attack nearest player
                    const entity = session.bot.nearestEntity(e => e.type === 'player' && e.username !== session.bot.username);
                    if(entity) {
                        session.bot.attack(entity);
                        await interaction.reply({ embeds: [createEmbed('Attack', `Attacking nearest player: **${entity.username}** ⚔️`)], ephemeral: true });
                    } else {
                        await interaction.reply({ embeds: [createEmbed('Attack', 'No nearby player found to attack.')], ephemeral: true });
                    }
                    break;
                }
                default:
                    await interaction.reply({ embeds: [createEmbed('Error', 'Unknown action 😕')], ephemeral: true });
            }
            return;
        }
        
        // Modal submissions
        if(interaction.isModalSubmit()){
            const userId = interaction.user.id;
            const session = userSessions[userId];
            if(!session){
                await interaction.reply({ embeds: [createEmbed('Error', 'Session not found!')], ephemeral: true });
                return;
            }
            if(interaction.customId === 'modal_change_name'){
                const newUsername = interaction.fields.getTextInputValue('new_username');
                session.username = newUsername;
                if(session.bot){
                    session.bot.end();
                    delete session.bot;
                }
                if(session.connect) {
                    session.bot = createBot(session, userId);
                }
                await interaction.reply({ embeds: [createEmbed('Name Changed', `Bot username changed to **${newUsername}** and reconnected (if online). 👍`)], ephemeral: true });
            } else if(interaction.customId === 'modal_send_message'){
                const chatMessage = interaction.fields.getTextInputValue('chat_message');
                if(session.bot){
                    session.bot.chat(chatMessage);
                    await interaction.reply({ embeds: [createEmbed('Message Sent', 'Your message was sent to the Minecraft server chat! ✉️')], ephemeral: true });
                } else {
                    await interaction.reply({ embeds: [createEmbed('Error', 'Bot is not connected 😕')], ephemeral: true });
                }
            }
            return;
        }
    } catch(error) {
        console.error('Interaction error:', error);
        try {
            await interaction.reply({ embeds: [createEmbed('Error', 'An error occurred while processing your interaction 😥')], ephemeral: true });
        } catch(_) {
            console.error('Failed to send error reply.');
        }
    }
});

// /settings command: Save server connection settings and remember for future sessions
function handleSettingsCommand(interaction, userId, options) {
    const host = options.getString('host');
    const port = options.getInteger('port');
    const username = options.getString('username');
    
    // Save or update the user's server settings
    userSessions[userId] = {
        host,
        port,
        username,
        connect: false,
        delay: 5000  // default delay before reconnecting is 5 seconds
    };
    
    interaction.reply({ embeds: [
        createEmbed('Settings Saved', 
            `Server connection saved:\n**Host:** ${host}\n**Port:** ${port}\n**Username:** ${username}\n\nYour connection details have been stored for future use. 😊`)
    ], ephemeral: true });
}

// /connect command: Connect to the saved server and remember connection
async function handleConnectCommand(interaction, userId) {
    const session = userSessions[userId];
    if(!session || !session.host || !session.port || !session.username){
        await interaction.reply({ embeds: [createEmbed('Error', 'You need to set up the server using `/settings` first 😕')], ephemeral: true });
        return;
    }
    
    await interaction.reply({ embeds: [createEmbed('Connecting', 'Attempting to connect to the server... ⏳')], ephemeral: true });
    session.connect = true;
    session.bot = createBot(session, userId);
}

// /disconnect command: Disconnect from the current server
async function handleDisconnectCommand(interaction, userId) {
    const session = userSessions[userId];
    if(session && session.bot){
        session.connect = false;
        cleanupBotTimers(session.bot);
        session.bot.end();
        delete session.bot;
        await interaction.reply({ embeds: [createEmbed('Disconnected', 'Bot successfully disconnected from the server. 👋')], ephemeral: true });
    } else {
        await interaction.reply({ embeds: [createEmbed('Error', 'Bot is not currently connected to any server 😕')], ephemeral: true });
    }
}

// /setcommand command: Set a command to execute upon successful connection
async function handleSetCommand(interaction, userId, options) {
    const command = options.getString('command');
    if(!userSessions[userId]){
        userSessions[userId] = {};
    }
    userSessions[userId].commandOnConnect = command;
    await interaction.reply({ embeds: [createEmbed('Command Set', `Command \`${command}\` will execute upon connecting to the server. 👍`)], ephemeral: true });
}

// /setdelay command: Set how long to wait before reconnecting
async function handleSetDelayCommand(interaction, userId, options) {
    const delay = options.getInteger('delay');
    if(!userSessions[userId]){
        userSessions[userId] = {};
    }
    userSessions[userId].delay = delay * 1000;
    await interaction.reply({ embeds: [createEmbed('Delay Set', `Reconnect delay has been set to **${delay} seconds**. ⏰`)], ephemeral: true });
}

// /help command: Provide usage instructions in a modern embedded design
async function handleHelpCommand(interaction) {
    const helpMessage = `
**Rylix AFK Bot Help** 😄

**Setup your server:**  
\`/settings <host> <port> <username>\`

**Connect:**  
\`/connect\`

**Disconnect:**  
\`/disconnect\`

**Set a command for auto-execution on connect:**  
\`/setcommand <command>\`

**Set reconnect delay:**  
\`/setdelay <delay_in_seconds>\`

**Control Panel:**  
\`/panel\` - Open the interactive panel to make the bot jump, look around, change name, send a chat message, or attack the nearest player.

_Note: The bot connects to Minecraft servers (versions 1.18 - 1.20.4) using offline mode._
    `;
    await interaction.reply({ embeds: [createEmbed('Help', helpMessage)] });
}

// /panel command: Open the interactive control panel for the bot
async function handlePanelCommand(interaction, userId) {
    const session = userSessions[userId];
    if(!session || !session.bot){
        await interaction.reply({ embeds: [createEmbed('Error', 'Please connect to a server using `/connect` before using the control panel.')], ephemeral: true });
        return;
    }
    
    const embed = createEmbed('Rylix AFK Bot Control Panel', 'Use the buttons below to control your bot. Enjoy! 🎮');
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
    await interaction.reply({ embeds: [embed], components: [row, row2], ephemeral: true });
}

// Create the Mineflayer bot and setup event handlers with keep-alive features
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
        // Log connection
        try {
            const logChannel = await client.channels.fetch(logChannelId);
            if(logChannel && logChannel.isTextBased()){
                await logChannel.send(`Connected to ${session.host}:${session.port} as ${session.username} 🎉`);
            }
        } catch(err){
            console.error('Error fetching log channel:', err);
        }
        bot.chat("Hello, I'm Your Server AFK & Anti Cheat Bot");
        if(session.commandOnConnect){
            bot.chat(session.commandOnConnect);
        }
        // Start keep-alive timers:
        scheduleKeepAlive(bot);
    });
    
    // Listen for chat messages from Minecraft and forward them to Discord log channel.
    bot.on('chat', async (username, message) => {
        try {
            const logChannel = await client.channels.fetch(logChannelId);
            if(logChannel && logChannel.isTextBased()){
                await logChannel.send(`🗣 [ Rylix SMP ] **${username}**: ${message}`);
            }
        } catch(err){
            console.error('Error during chat event:', err);
        }
    });
    
    bot.on('end', async () => {
        cleanupKeepAlive(bot);
        if(!errorHandled){
            errorHandled = true;
            await handleBotDisconnection(userId, session);
        }
    });
    
    bot.on('error', async error => {
        cleanupKeepAlive(bot);
        if(!errorHandled){
            errorHandled = true;
            await handleBotError(userId, session, error);
        }
    });
    
    return bot;
}

// Schedules keep-alive actions: look around every 15 seconds and a single jump every 10 minutes.
function scheduleKeepAlive(bot) {
    // Look around timer every 15 seconds.
    bot.keepAliveLookInterval = setInterval(() => {
        try {
            const randomYaw = Math.random() * (2 * Math.PI);
            bot.look(randomYaw, bot.entity.pitch, true);
        } catch (e) {
            console.error('Error in keep-alive look interval:', e);
        }
    }, 15000);

    // Jump once every 10 minutes.
    bot.keepAliveJumpInterval = setInterval(() => {
        try {
            bot.jump();
        } catch (e) {
            console.error('Error in keep-alive jump interval:', e);
        }
    }, 600000);
}

// Clears keep-alive timers for the bot.
function cleanupKeepAlive(bot) {
    if(bot.keepAliveLookInterval) {
        clearInterval(bot.keepAliveLookInterval);
        delete bot.keepAliveLookInterval;
    }
    if(bot.keepAliveJumpInterval) {
        clearInterval(bot.keepAliveJumpInterval);
        delete bot.keepAliveJumpInterval;
    }
}

// Cleanup any additional bot timers (if any manual timers exist)
function cleanupBotTimers(bot) {
    cleanupKeepAlive(bot);
    if(bot.manualJumpInterval) {
        clearInterval(bot.manualJumpInterval);
        delete bot.manualJumpInterval;
    }
}

async function handleBotDisconnection(userId, session) {
    console.log(`Bot disconnected from ${session.host}:${session.port}`);
    try {
        if(userSessions[userId] && userSessions[userId].connect === true) {
            const logChannel = await client.channels.fetch(logChannelId);
            if(logChannel && logChannel.isTextBased()){
                await logChannel.send(`<@${userId}>, disconnected from ${session.host}:${session.port}. Reconnecting in ${session.delay / 1000}s ⏰`);
            }
            setTimeout(() => {
                if(userSessions[userId] && userSessions[userId].connect){
                    userSessions[userId].bot = createBot(session, userId);
                }
            }, session.delay);
        }
    } catch(err) {
        console.error('Error during handleBotDisconnection:', err);
    }
}

async function handleBotError(userId, session, error) {
    console.error('Bot error:', error);
    try {
        if(userSessions[userId] && userSessions[userId].connect === true) {
            const logChannel = await client.channels.fetch(logChannelId);
            if(logChannel && logChannel.isTextBased()){
                await logChannel.send(`<@${userId}>, encountered an error connecting to ${session.host}:${session.port}. Please try again with /connect 😥`);
            }
            userSessions[userId].connect = false;
            if(session && session.bot){
                session.bot.removeAllListeners();
                cleanupBotTimers(session.bot);
                session.bot.end();
                delete session.bot;
            }
        }
    } catch(err) {
        console.error('Error during handleBotError:', err);
    }
}
