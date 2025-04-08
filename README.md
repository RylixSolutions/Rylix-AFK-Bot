# Rylix AFK Bot 🚀🤖

Welcome to **Rylix AFK Bot**! This modern, sleek, and feature-rich bot empowers you to manage your Minecraft server connections directly from Discord. Built with [discord.js](https://discord.js.org/) and [mineflayer](https://github.com/PrismarineJS/mineflayer), it comes with an interactive control panel, stylish embedded messages, and a host of powerful in-game commands—all featuring the iconic Rylix logo.

<img src="https://cdn.imrishmika.site/rylix/RYLIX-white.png" alt="Rylix Logo" width="250"/>

---

## Features

- **Server Connection Management** 🔌  
  - Save your Minecraft server details with the `/settings` command.
  - Connect to your server using `/connect` and disconnect using `/disconnect`.
  - Auto-reconnect with a configurable delay via `/setdelay`.

- **In-Game Commands & Chat Logging** 💬  
  - Execute a predefined command on connection with `/setcommand` (ideal for automatic password login).
  - Automatically forward all in-game chat messages to your designated Discord log channel.

- **Interactive Control Panel** 🎮  
  - Open the interactive control panel with `/panel` to access buttons for:
    - **Jump:** Toggle a natural jump loop.
    - **Look Around:** Change the bot's view direction randomly.
    - **Change Name:** Update the bot’s username using a modal.
    - **Send Message:** Relay custom messages from Discord to the Minecraft server.
    - **Attack:** Command the bot to attack the nearest player (new feature).
    - **Disconnect:** Manually disconnect the bot.

- **Modern Stylish UI** ✨  
  - Sleek embedded messages with consistent use of the Rylix logo.
  - Fully interactive design using buttons and modals.

- **New Features**  
  - **Attack Nearest Player:** Use the new attack feature from the control panel to attack the closest player.

---

## Installation

### Prerequisites

- **Node.js:** Version 16 or higher.
- **Discord Bot Token:** Create a Discord bot and copy its token.
- **Minecraft Server:** The server must be running Minecraft (versions 1.18 to 1.20.4) in offline/cracked mode.

### Setup Instructions

1. **Clone the Repository**

   ```bash
   git clone https://github.com/RishBroProMax/rylix-afk-bot.git
   cd rylix-afk-bot
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment Variables**

   Create a `.env` file in the root directory with the following content:

   ```env
   DISCORD_TOKEN=your_discord_bot_token_here
   LOG_CHANNEL_ID=your_log_channel_id_here
   ```

   Replace `your_discord_bot_token_here` and `your_log_channel_id_here` with your actual credentials.

4. **Run the Bot**

   ```bash
   node bot.js
   ```

---

## Usage

1. **Set Up Your Server Connection**

   Use the `/settings` command with parameters `<host> <port> <username>` to save your Minecraft server details for future connections.

2. **Connect to Your Server**

   Execute `/connect` to connect the bot to your Minecraft server.

3. **Access the Control Panel**

   Open the interactive control panel with `/panel` to control the bot using the following actions:
   - **Jump:** Toggle a jump loop that simulates a natural jumping behavior.
   - **Look Around:** Randomly change the bot’s view direction.
   - **Change Name:** Update the bot’s username via a modal.
   - **Send Message:** Relay custom messages to the Minecraft server chat.
   - **Attack:** Command the bot to target the nearest player.
   - **Disconnect:** End the current connection manually.

4. **Additional Commands**

   - `/setcommand <command>`: Define a command that automatically executes on connection.
   - `/setdelay <delay_in_seconds>`: Set the delay before the bot attempts to reconnect.
   - `/disconnect`: Manually disconnect the bot.
   - `/help`: View detailed instructions and usage information.

---

## Hosting Recommendation

For reliable and affordable hosting, we highly recommend [WispByte](https://wispbyte.com/). Their plans offer excellent performance and uptime, making them an ideal choice for hosting the Rylix AFK Bot.

---

## Credits

Developed with ❤️ by **RishBroProMax**  
If you enjoy this project, please give it a star ⭐ on GitHub and share it with others!

---

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request for bug fixes, enhancements, or new features.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Enjoy using **Rylix AFK Bot** and transform your Minecraft server management experience! Don't forget to ⭐ the repository if you love it!
