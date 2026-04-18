# 🏙️ City of Tomorrow — Discord Bot

A full-featured Discord bot for the City of Tomorrow Roblox RP game.

---

## ✅ Features

- **Moderation** — kick, ban, unban, warn, mute/unmute, purge, slowmode, lock/unlock
- **Game Integration** — gun licenses, booster management, game announcements
- **Auto Server Setup** — one command creates ALL channels, roles & permissions
- **Welcome System** — auto-welcome new members + give Civilian role
- **Game Log Feed** — receives arrest/donation/robbery/salary logs from Roblox
- **24/7 Hosting** — runs on Railway (free tier works great)

---

## 🚀 Quick Deploy to Railway (Free, 24/7)

1. **Push this folder to GitHub**
   - Create a new repo on github.com
   - Upload all files from this folder

2. **Go to railway.app**
   - Sign in with GitHub
   - Click **New Project** → **Deploy from GitHub repo**
   - Select your bot repo

3. **Set Environment Variables in Railway**
   - Go to your project → Variables tab
   - Add these variables:
   ```
   DISCORD_TOKEN = YOUR_NEW_TOKEN_HERE
   CLIENT_ID     = 1494380267610050751
   GUILD_ID      = YOUR_DISCORD_SERVER_ID_HERE  ← Right-click server → Copy Server ID
   PORT          = 3000
   ```

4. **Deploy!** — Railway will build and start the bot automatically.

5. **Run `/setup-server`** in your Discord server — it creates everything!

---

## 📋 Getting Your Guild ID

1. Open Discord
2. Right-click your server name in the sidebar
3. Click "Copy Server ID"
4. Paste it as `GUILD_ID` in Railway

---

## ⚠️ IMPORTANT SECURITY NOTE

Your bot token has been shared in this session. You should **regenerate it**:
1. Go to discord.com/developers/applications
2. Select your bot application
3. Bot → Reset Token → Copy the new one
4. Update it in Railway Variables

---

## 📋 Slash Commands

### Moderation
| Command | Description |
|---|---|
| `/kick @user [reason]` | Kick a member |
| `/ban @user [reason] [delete_days]` | Ban a user |
| `/unban user_id [reason]` | Unban by ID |
| `/warn @user reason` | Warn a member |
| `/warnings @user` | View user warnings |
| `/clearwarnings @user` | Clear all warnings |
| `/mute @user duration [reason]` | Timeout a member |
| `/unmute @user` | Remove timeout |
| `/purge amount [@user]` | Delete messages |
| `/slowmode seconds` | Set channel slowmode |
| `/lock lock/unlock [reason]` | Lock/unlock channel |

### Game Integration
| Command | Description |
|---|---|
| `/license-grant roblox_id name` | Grant gun license |
| `/license-revoke roblox_id` | Revoke gun license |
| `/license-list` | View all licenses |
| `/license-check roblox_id` | Check if player has license |
| `/booster-add @user [roblox_id]` | Add booster (+$12/cycle) |
| `/booster-remove @user` | Remove booster |
| `/booster-list` | View all boosters |
| `/announce title message [type]` | Post announcement |
| `/serverinfo` | View server stats |
| `/userinfo [@user]` | View user info |

### Setup
| Command | Description |
|---|---|
| `/setup-server` | Create all channels, roles & permissions (owner only) |

---

## 🔧 How Game → Discord Logging Works

The Roblox game sends webhook payloads to your Discord webhook URL. Each log type
goes to its corresponding channel:
- Arrests → `🚔・arrest-logs`
- Donations → `💸・donation-logs`
- Robberies → `🏦・robbery-logs`
- Salary → `💰・salary-logs`

These are already configured in your game's `WebhookSender_Core`.

---

## 📂 File Structure

```
discord-bot/
├── src/
│   ├── bot.js                 ← Main bot (start here)
│   ├── commands/
│   │   ├── mod.js            ← Moderation commands
│   │   ├── game.js           ← Game integration commands
│   │   └── setup.js          ← Server setup command
│   └── utils/
│       ├── database.js        ← SQLite database
│       └── embeds.js          ← Styled Discord embeds
├── data/
│   └── bot.db                 ← Created automatically
├── .env                       ← Your config (never share this!)
├── package.json
├── railway.toml               ← Railway hosting config
└── README.md
```
