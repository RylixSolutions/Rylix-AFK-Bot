# Rylix AFK Bot 🚀🤖

Welcome to the **Rylix AFK Bot**! This modern and sleek bot empowers you to manage your Minecraft server connections directly via Discord. Built with [discord.js](https://discord.js.org/) and [mineflayer](https://github.com/PrismarineJS/mineflayer), its interactive embedded UI and cool features will make managing your server a breeze!


## Features

- **Server Connection Management** 🔌  
  - Save your Minecraft server connection settings with the `/settings` command.  
  - Connect to your server using `/connect` and disconnect with `/disconnect`.  
  - Auto-reconnect on disconnection with a configurable delay via `/setdelay`.

- **In-Game Commands & Chat Logging** 💬  
  - Automatically execute commands on connection using `/setcommand` (perfect for password logins).  
  - Monitor and forward all in-game chat messages to a designated Discord log channel.

- **Interactive Control Panel** 🎮  
  - Open the interactive control panel via `/panel` to:  
    - **Jump:** Toggle a natural jump loop with recurring jumps.  
    - **Look Around:** Randomly change the bot's view direction.  
    - **Change Name:** Update the bot's username via a modal.  
    - **Send Message:** Send custom messages to the Minecraft server from Discord.  
    - **Disconnect:** Manually disconnect the bot from the server.

- **Modern & Stylish UI** ✨  
  - Enjoy sleek embedded messages with the Rylix logo throughout the interface.  
  - Complete interactive design with buttons, modals, and embedded notifications.

## Installation

### Prerequisites

- **Node.js:** Version 16 or higher.
- **Discord Bot Token:** Create a Discord bot and obtain its token.
- **Minecraft Server:** Running Minecraft (versions 1.18 to 1.20.4) in offline/cracked mode.

### Setup Steps

1. **Clone the Repository**

   ```bash
   git clone https://github.com/RishBroProMax/rylix-afk-bot.git
   cd rylix-afk-bot
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Configure the Bot**

   - Open the `bot.js` file.
   - Replace `YOUR_DISCORD_BOT_TOKEN_HERE` with your actual Discord bot token.

4. **Run the Bot**

   ```bash
   node bot.js
   ```

## Usage

1. **Set Up Server Connection**

   Use the `/settings` command with the required parameters (host, port, username). Your connection details will be saved for future use.

2. **Connect to Your Minecraft Server**

   Execute the `/connect` command to establish a connection to your server.

3. **Control the Bot**

   Open the control panel via `/panel` and use the interactive buttons to make the bot perform various in-game actions such as jumping, looking around, changing its name, or sending messages.

4. **Additional Commands**

   - `/setcommand <command>`: Automatically execute a command upon connection.
   - `/setdelay <delay_in_seconds>`: Configure the delay before the bot attempts to reconnect after disconnection.
   - `/disconnect`: Manually disconnect the bot.
   - `/help`: Display this detailed help message.

## Hosting Recommendation

For reliable and affordable hosting, we highly recommend using [WispByte](https://wispbyte.com/). Their plans offer excellent performance and uptime, making them a perfect choice for hosting your Rylix AFK Bot and other applications.

## Credits

Developed with ❤️ by **RishBroProMax**  
If you like this project, please give it a star ⭐ on GitHub!

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request for improvements, bug fixes, or new features.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

---

Enjoy using **Rylix AFK Bot** and make your Minecraft server interactions fun and efficient! Don't forget to ⭐ the repo if you love it!
