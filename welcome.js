require('dotenv').config();
const { Client, GatewayIntentBits, ChannelType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// To store channel info in memory
let channelBackup = {};

// Load channel info from 'servers.json' if it exists
const backupFilePath = path.join(__dirname, 'servers.json');
if (fs.existsSync(backupFilePath)) {
    channelBackup = JSON.parse(fs.readFileSync(backupFilePath, 'utf-8'));
}

// Save the channelBackup to 'servers.json'
const saveChannelBackup = () => {
    fs.writeFileSync(backupFilePath, JSON.stringify(channelBackup, null, 2));
};

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Initial member count update for all guilds
    client.guilds.cache.forEach((guild) => {
        updateMemberCount(guild);
    });

    // Set a custom status
    client.user.setPresence({
        activities: [],
        status: 'online',
    });

    // Schedule member count updates every 5 minutes
    setInterval(() => {
        client.guilds.cache.forEach((guild) => {
            updateMemberCount(guild);
        });
    }, 300000);
});

const updateMemberCount = async (guild) => {
    const memberCountChannelId = channelBackup[guild.id]?.MEMBER_COUNT_CHANNEL_ID;

    if (memberCountChannelId) {
        const channel = guild.channels.cache.get(memberCountChannelId);
        if (channel) {
            try {
                // Force fetch all members
                const members = await guild.members.fetch({ withPresences: false });
                const humanCount = members.filter(m => !m.user.bot).size;

                console.log(`[MEMBER COUNT] Guild: ${guild.name} (${guild.id}) | Total: ${guild.memberCount} | Humans: ${humanCount} | Bots: ${members.size - humanCount}`);

                await channel.setName(`・🏡︱Members: ${humanCount}`).catch(err => {
                    console.error(`[MEMBER COUNT] Failed to update channel name in ${guild.name}:`, err);
                });

            } catch (error) {
                console.error(`[MEMBER COUNT] Failed to fetch members for ${guild.id}:`, error);
            }
        } else {
            console.warn(`[MEMBER COUNT] Channel ID ${memberCountChannelId} not found in guild ${guild.name}`);
        }
    } else {
        console.warn(`[MEMBER COUNT] No MEMBER_COUNT_CHANNEL_ID set for guild ${guild.name}`);
    }
};

client.on('guildMemberAdd', async (member) => {
    const guildConfig = channelBackup[member.guild.id];
    if (!guildConfig) return;

    // Welcome Message
    const welcomeChannelId = guildConfig.WELCOME_CHANNEL;
    const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);
    const rulesChannelId = guildConfig.RULES_CHANNEL;
    const av = member.displayAvatarURL({ dynamic: true })
    if (welcomeChannel && welcomeChannel.type === ChannelType.GuildText) {
        const welcomeEmbed = new EmbedBuilder()
            .setColor(0x2F3136)
            .setDescription(`**HEY ${member}**\n\n**WELCOME TO ${member.guild.name.toUpperCase()}**\n\n**BE SURE TO READ <#${rulesChannelId}>**\n\n**CONTACT STAFF IN CASE OF ISSUE**`)
            .setThumbnail(av)
            .setFooter({ text: 'Op Core' })
            .setTimestamp();

        welcomeChannel.send({ embeds: [welcomeEmbed] });
    }

    // Assign default role
    const roleId = guildConfig.DEFAULT_ROLE_ID;
    const role = member.guild.roles.cache.get(roleId);
    if (role) {
        try {
            await member.roles.add(role);
        } catch (error) {
            console.error('Failed to add role:', error);
        }
    }

    // Update member count
    updateMemberCount(member.guild);
});

client.on('guildMemberRemove', async (member) => {
    const guildConfig = channelBackup[member.guild.id];
    if (!guildConfig) return;

    // Leave Message
    const leaveChannelId = guildConfig.BYE_CHANNEL;
    const leaveChannel = member.guild.channels.cache.get(leaveChannelId);
    if (leaveChannel && leaveChannel.type === ChannelType.GuildText) {
        const leaveEmbed = new EmbedBuilder()
            .setColor(0x2F3136)
            .setDescription(`**<@${member.user.id}> has left the server.**`)
            .setFooter({ text: 'Op Core' })
            .setTimestamp();

        leaveChannel.send({ embeds: [leaveEmbed] });
    }

    // Update member count
    updateMemberCount(member.guild);
});

// Cooldown map to prevent spam
const cooldowns = new Map();

client.on('messageCreate', async message => {
    // Ignore messages from bots
    if (message.author.bot) return;

    // Check if the message is in the specific guild
    if (message.guild?.id !== process.env.CHILLZONE) return;

    // Check if the message is in the specific channel
    if (message.channel.id === process.env.FRIEND_CODE_CHANNEL) {
        try {
            // Check cooldown
            const cooldownTime = 5000; // 5 seconds
            const now = Date.now();
            const userCooldown = cooldowns.get(message.author.id);
            
            if (userCooldown && (now - userCooldown) < cooldownTime) {
                await message.delete();
                const remainingTime = ((cooldownTime - (now - userCooldown)) / 1000).toFixed(1);
                const warningMsg = await message.channel.send(
                    `${message.author}, please wait ${remainingTime}s before sending another message.`
                );
                setTimeout(() => warningMsg.delete().catch(() => {}), 3000);
                return;
            }
            
            cooldowns.set(message.author.id, now);

            // Clean and validate the message format
            const cleanContent = message.content.trim().replace(/\s+/g, '').toUpperCase();
            const formatRegex = /^#?[A-Z]{3}[0-9]{3}$/;

            if (!formatRegex.test(cleanContent)) {
                await message.delete();
                const warningMsg = await message.channel.send(
                    `${message.author}, your message must be in the format \`XXX111\` (three letters and three numbers, optionally starting with #).`
                );
                setTimeout(() => warningMsg.delete().catch(() => {}), 5000);
                return;
            }

            // Keep only the latest message
            const messages = await message.channel.messages.fetch({ limit: 100 });
            const messagesToDelete = messages.filter(msg => msg.id !== message.id);
            
            if (messagesToDelete.size > 0) {
                await message.channel.bulkDelete(messagesToDelete, true).catch(error => {
                    console.error('Error bulk deleting messages:', error);
                });
            }

        } catch (error) {
            console.error('Error in friend code channel handling:', error);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);