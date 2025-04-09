# Rylix AFK Bot

Rylix AFK Bot is a Discord-controlled Minecraft bot that uses [mineflayer](https://github.com/PrismarineJS/mineflayer) and [discord.js](https://github.com/discordjs/discord.js). The bot connects to a Minecraft server in offline mode and simulates player activity to prevent idling by performing automated actions.

## Features

- **Keep Alive Mechanism**  
  The bot periodically performs actions to appear active:
  - **Look Around**: Automatically looks around every 15 seconds.
  - **Jump**: Executes a jump once every 10 minutes.
- **Discord Slash Commands**  
  Control the bot with a series of easy-to-use slash commands:
  - `/settings` – Save server connection details (host, port, username).
  - `/connect` – Connect the bot to the server.
  - `/disconnect` – Disconnect the bot from the server.
  - `/setcommand` – Set a command to run automatically upon connection.
  - `/setdelay` – Adjust the delay before the bot attempts to reconnect.
  - `/help` – Display help information.
  - `/panel` – Open an interactive control panel for manual actions such as jump, look around, change name, and send chat messages.
- **Interactive Control Panel**  
  Use Discord's interactive buttons and modals to manually control the bot.

## Setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/rylix-afk-bot.git
   cd rylix-afk-bot
   ```

2. **Install Dependencies**

   Make sure you have [Node.js](https://nodejs.org/) installed. Then, run:

   ```bash
   npm install
   ```

3. **Configuration**

   Create a `.env` file in the root directory with the following variables:

   ```env
   DISCORD_TOKEN=your_discord_bot_token
   LOG_CHANNEL_ID=your_discord_log_channel_id
   ```

4. **Run the Bot**

   Start the bot with the command:

   ```bash
   node index.js
   ```

## Usage

- **Configure the Bot:**  
  Use the `/settings <host> <port> <username>` command to set up your Minecraft server connection details.

- **Connect/Disconnect:**  
  - Use `/connect` to connect the bot to the Minecraft server.
  - Use `/disconnect` to disconnect the bot.

- **Control Panel:**  
  Issue `/panel` to open the interactive control panel for executing manual commands on the bot.

- **Additional Commands:**  
  - `/setcommand`: Set a command to be executed when the bot connects.
  - `/setdelay`: Adjust the reconnect delay time.
  - `/help`: Display detailed help about commands and functionalities.

## Contributing

Contributions are welcome! Please fork this repository and create a pull request with your improvements. Ensure your contributions adhere to the project's coding style and include appropriate documentation.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for full details.
