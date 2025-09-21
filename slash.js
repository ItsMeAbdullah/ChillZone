const { Client, GatewayIntentBits, REST, Routes, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, ActivityType, Partials, PermissionFlagsBits, ChannelType  } = require('discord.js');
require('dotenv').config();
const { Manager } = require('erela.js');
const { error } = require('console');
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const { spawn, exec } = require('child_process');
const { writeFileSync, existsSync, readFileSync } = require('fs');
const path = require('path');
const axios = require('axios');
const { deserialize } = require('v8');


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [
        Partials.Message,
        Partials.Channel, 
        Partials.Reaction
    ],
});
const authorizedUserIds = [process.env.ABDULLAH];
const commands = [
    {
        name: 'ping',
        description: 'Pong!',
    },
    {
        name: 'links',
        description: 'Links to bot connections!',
    },
    {
        name: 'kick',
        description: 'Kicks a user from the server.',
        options: [
            {
                name: 'user',
                type: 6, // USER type
                description: 'The user to kick',
                required: true,
            },
            {
                name: 'reason',
                type: 3, // STRING type
                description: 'The reason for the kick',
                required: true,
            },
        ],
    },
    {
        name: 'ban',
        description: 'Bans a user from the server.',
        options: [
            {
                name: 'user',
                type: 6, // USER type
                description: 'The user to ban',
                required: true,
            },
            {
                name: 'reason',
                type: 3, // STRING type
                description: 'The reason for the ban',
                required: true,
            },
        ],
    },
    {
        name: 'tmt',
        description: 'Timeouts a user for a specified duration in seconds.',
        options: [
            {
                name: 'user',
                type: 6, // USER type
                description: 'The user to timeout',
                required: true,
            },
            {
                name: 'duration',
                type: 4, // INTEGER type
                description: 'Duration of the timeout in seconds',
                required: true,
            },
        ],
    },
    {
        name: 'ctmt',
        description: 'Cancels the timeout for a user.',
        options: [
            {
                name: 'user',
                type: 6, // USER type
                description: 'The user to cancel timeout for',
                required: true,
            },
        ],
    },
    {
        name: 'clear',
        description: 'Clears a specified number of messages from a channel.',
        options: [
            {
                name: 'amount',
                type: 4, // INTEGER type
                description: 'Number of messages to clear',
                required: true,
            },
        ],
    },
    {
        name: 'setstatus',
        description: 'Change Bot status',
        options: [
            {
                name: 'type',
                description: 'Activity type',
                type: 3, // STRING type
                required: true,
                choices: [
                    { name: 'Playing', value: 'playing' },
                    { name: 'Listening', value: 'listening' },
                    { name: 'Watching', value: 'watching' },
                    { name: 'Competing', value: 'competing' },
                    { name: 'Custom', value: 'custom' }
                ]
            },
            {
                name: 'message',
                description: 'Status message',
                type: 3, // STRING type
                required: true
            },
        ]
    },
    {
        name: 'info',
        description: 'Get information about a user or yourself.',
        options: [
            {
                type: 6, // USER type
                name: 'user',
                description: 'The user to get information about.',
                required: false
            }
        ]
    },
    {
        name: 'av',
        description: 'Get avatar',
        options: [
            {
                type: 6, // USER type
                name: 'user',
                description: 'The user to get avatar of',
                required: false
            }
        ]
    },
    {
        name: 'banner',
        description: 'Get banner',
        options: [
            {
                type: 6, // USER type
                name: 'user',
                description: 'The user to get banner of',
                required: false
            }
        ]
    },
    {
        name: 'help',
        description: 'Displays help information about the bot.',
    },
    {
        name: 'server',
        description: 'Sends server details.',
    },
    {
        name: 'role',
        description: 'Give or take a role from a user.',
        options: [
            {
                name: 'user',
                type: 6, // USER type
                description: 'The user to give or take the role from',
                required: true,
            },
            {
                name: 'role',
                type: 8, // ROLE type
                description: 'The role to give or take',
                required: true,
            },
            {
                name: 'action',
                type: 3, // STRING type
                description: 'The action to perform (give or take)',
                required: true,
                choices: [
                    {
                        name: 'Give',
                        value: 'give',
                    },
                    {
                        name: 'Take',
                        value: 'take',
                    },
                ],
            },
        ],
    },
    {
        name: 'setup',
        description: 'Set up server configurations',
        options: [
            {
                name: 'welcome',
                description: 'Channel for welcome messages',
                type: 7, // Channel type
                required: true,
            },
            {
                name: 'bye',
                description: 'Channel for goodbye messages',
                type: 7, // Channel type
                required: true,
            },
            {
                name: 'member',
                description: 'Channel to display member count',
                type: 7, // Channel type
                required: true,
            },
            {
                name: 'rules',
                description: 'Channel for server rules',
                type: 7, // Channel type
                required: true,
            },
            {
                name: 'role',
                description: 'Role to assign to new members',
                type: 8, // Role type
                required: true,
            },
        ],
    },
    {
        name: 'banlist',
        description: 'List of banned users.',
    },
    // {
    //     name: 'play',
    //     description: 'Play a song from a YouTube URL',
    //     options: [
    //       {
    //         name: 'query',
    //         type: 3, // STRING
    //         description: 'Song name or link',
    //         required: true,
    //       },
    //     ],
    //   },
    //   {
    //     name: 'join',
    //     description: 'Join a selected voice channel.',
    //     options: [
    //       {
    //         type: 7, // Type 7 is for channels
    //         name: 'channel',
    //         description: 'Select a voice channel to join',
    //         required: true,
    //         channel_types: [ChannelType.GuildVoice], // Restrict to voice channels only
    //       },
    //     ],
    //   },


];
const manager = new Manager({
    nodes: [
        {
            host: 'localhost', // Lavalink server
            port: 2333,        // Port from application.yml
            password: 'ben10sondoda', // Password from application.yml
        },
    ],
    send(id, payload) {
        const guild = client.guilds.cache.get(id);
        if (guild) guild.shard.send(payload);
    },
});
const player = createAudioPlayer();
let connection;
let nowPlayingMessage;
let channelBackup = {};
const backupFilePath = path.join(__dirname, 'servers.json');

// Load channel info from 'servers.json' if it exists
if (existsSync(backupFilePath)) {
    channelBackup = JSON.parse(readFileSync(backupFilePath, 'utf-8'));
}

// Save the channelBackup to 'servers.json'
const saveChannelBackup = () => {
    writeFileSync(backupFilePath, JSON.stringify(channelBackup, null, 2));
};

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.CHILLZONE),
            { body: commands }
            
        );
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.CZPK),
            { body: commands }
            
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    manager.init(client.user.id);
});
client.on('raw', (d) => manager.updateVoiceState(d));



client.on('interactionCreate', async interaction => {
    if (!interaction.guild) return;

    if (!interaction.isCommand()) return;

    const { commandName, options, member } = interaction;

   

    if (commandName === 'ping') {
        await interaction.reply({ content: "Pong!", ephemeral: true });
    }

    if (commandName === 'kick') {
        // Defer the reply to acknowledge the interaction
        await interaction.deferReply({ ephemeral: true });
    
        const user = options.getUser('user');
        const reason = options.getString('reason') || 'No reason provided'; // Default reason if not given
        const guild = interaction.guild;
    
        try {
            // Fetch the member object to perform the kick
            const memberToKick = await guild.members.fetch(user.id);
            
            // Check if the command executor has permission to kick members
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
                return interaction.editReply('You do not have permission to kick members.');
            }
    
            // Check if the bot has permission to kick members
            if (!guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers)) {
                return interaction.editReply('I do not have permission to kick members.');
            }
    
            // Prevent kicking users with a higher role than the command executor or the bot
            if (memberToKick.roles.highest.position >= interaction.member.roles.highest.position) {
                return interaction.editReply('You cannot kick a member with an equal or higher role than yourself.');
            }
    
            if (memberToKick.roles.highest.position >= guild.members.me.roles.highest.position) {
                return interaction.editReply('I cannot kick a member with an equal or higher role than myself.');
            }
    
            // Kick the member with the reason
            await memberToKick.kick(reason);
    
            if (memberToKick.user.bot) {
                // The member to kick is a bot
                return interaction.editReply(`${user.tag} has been kicked.\n**Reason:** ${reason}`);
            }
            
            try {

                const invite = await interaction.channel.createInvite({
                    maxAge: 604800, // Link expires in 1 hour
                    maxUses: 5,   // Set the maximum number of uses (optional)
                    unique: true, // Ensures a unique invite code is created
                });

                await user.send(`Hey <@${user.id}>,\nYou have been kicked from ${guild.name}.\n**Reason:** ${reason}\nRejoin:${invite.url}`);
            } catch (dmError) {
                console.error('Error sending DM:', dmError);
                // Optionally inform the command executor if DMs couldn't be sent
                await interaction.followUp({ content: `I couldn't send a DM to ${user.tag}. They might have DMs disabled.`, ephemeral: true });
            }
    
            return interaction.editReply(`${user.tag} has been kicked.\n**Reason:** ${reason}`);
            
        } catch (error) {
            console.error('Error kicking user:', error);
            
            // Check if the member is in the server
            if (error.message.includes('Unknown Member')) {
                return interaction.editReply('That user is not in the server.');
            }
    
            return interaction.editReply("I couldn't kick the member.");
        }
    }
    
    

    if (commandName === 'ban') {
        // Defer the reply to acknowledge the interaction
        await interaction.deferReply({ ephemeral: true });
    
        const user = options.getUser('user');
        const reason = options.getString('reason'); // Corrected this line
        const guild = interaction.guild;
    
        // Fetch the member object to perform the ban
        const memberToBan = await interaction.guild.members.fetch(user.id);
    
        // Check if the command executor has permission to ban members
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.editReply('You do not have permission to ban members.');
        }
    
        try {
            // Ban the member with the reason, which will also be logged in the audit log
            await memberToBan.ban({ reason });
            
            if (memberToBan.user.bot) {
                return interaction.editReply(`${user.tag} has been banned. Reason: ${reason}`);
            }

            // Send a DM to the banned user
            try {
                await user.send(`Hey <@${user.id}>,\nYou have been banned from ${guild.name}.\n**Reason:** ${reason}`);
            } catch (dmError) {
                console.error('Error sending DM:', dmError);
                // Handle cases where the user has DMs disabled or other issues
            }
            return interaction.editReply(`${user.tag} has been banned. Reason: ${reason}`);
        } catch (error) {
            console.error('Error banning user:', error);
            return interaction.editReply("I couldn't ban the member.");
        }
    }
    if (commandName === 'unban') {
        // Defer the reply to acknowledge the interaction Op C
        await interaction.deferReply({ ephemeral: true });
    
        // Check if the command executor has permission to ban members
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.editReply('You do not have permission to use this command.');
        }
    
        // Get the user ID to unban
        const userId = interaction.options.getString('user_id');
        const guild = interaction.guild;
    
        if (!userId) {
            return interaction.editReply('Please provide a valid user ID.');
        }
    
        try {
            // Check if the user ID is currently banned
            const bannedUsers = await guild.bans.fetch();
            if (!bannedUsers.has(userId)) {
                return interaction.editReply('This user is not banned.');
            }
    
            // Unban the user
            await guild.bans.remove(userId);
    
            // Fetch the user object for additional checks
            const user = await interaction.client.users.fetch(userId);
    
            // Check if the unbanned user is a bot
            if (user.bot) {
                return interaction.editReply(`Successfully unbanned the bot: ${user.tag}.`);
            }
    
            // Send a DM to the user informing them they have been unbanned
            try {
                const invite = await interaction.channel.createInvite({
                    maxAge: 604800, // Link expires in 1 hour
                    maxUses: 5,   // Set the maximum number of uses (optional)
                    unique: true, // Ensures a unique invite code is created
                });
                await user.send(`Hey <@${userId}>,\nYou have been unbanned from ${guild.name}.\n**Link:** ${invite.url}`);
            } catch (dmError) {
                console.error('Error sending DM:', dmError);
                // Handle cases where the user has DMs disabled or other issues
            }
    
            // Confirm the unban in the interaction reply
            return interaction.editReply(`Successfully unbanned ${user.tag}.`);
        } catch (error) {
            console.error('Error unbanning user:', error);
            return interaction.editReply('An error occurred while trying to unban the user.');
        }
    }
    
    

    if (commandName === 'tmt') {
        const user = interaction.options.getUser('user');
        const duration = interaction.options.getInteger('duration');
        const member = await interaction.guild.members.fetch(user.id);

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: "You do not have permission to timeout members.", ephemeral: true });
        }

        try {
            await member.timeout(duration * 60 * 100, 'Timed out by bot');
            await interaction.reply(`${user} has been timed out for ${duration} seconds.`);
        } catch (error) {
            await interaction.reply({ content: "I couldn't timeout the member.", ephemeral: true });
        }
    }

    if (commandName === 'ctmt') {
        const user = interaction.options.getUser('user');
        const member = await interaction.guild.members.fetch(user.id);

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: "You do not have permission to cancel timeouts.", ephemeral: true });
        }

        try {
            await member.timeout(null, 'Timeout cancelled by bot');
            await interaction.reply(`${user}'s timeout has been cancelled.`);
        } catch (error) {
            await interaction.reply({ content: "I couldn't cancel the timeout.", ephemeral: true });
        }
    }

    if (commandName === 'clear') {
        const amount = interaction.options.getInteger('amount');
    
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: "You do not have permission to clear messages.", ephemeral: true });
        }
    
        if (amount < 1 || amount > 100) {
            return interaction.reply({ content: "Please enter a number between 1 and 100.", ephemeral: true });
        }
    
        const channel = interaction.channel;
        try {
            await channel.bulkDelete(amount, true);
            await interaction.reply({ content: `Successfully deleted ${amount} messages.`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "There was an error trying to clear messages in this channel!", ephemeral: true });
        }
    }  
    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

    if (commandName === 'links') {
        const avatarURL = client.user.displayAvatarURL({ dynamic: true, size: 512 });
        const welcomeEmbed = new EmbedBuilder()
            .setColor(0x2F3136)
            .setAuthor({ name: 'ChillZone', iconURL: avatarURL })
            .setFooter({ text: 'Developed by Abdullah' });
    
        // Create buttons
        const row = new ActionRowBuilder()
            .addComponents(
                // This button will open the vote URL when clicked
                new ButtonBuilder()
                    .setLabel('Discord')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.gg/czpk'),  // Change to your vote link
    

                
                // Support button will link to the support server
                new ButtonBuilder()
                    .setLabel('Website')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://abdullahboostingservices.vercel.app/'),  // Change to your support server link
            );

    
        // Send the embed with buttons
        await interaction.reply({ embeds: [welcomeEmbed], components: [row] });
    }
    
if (commandName === 'info') {
    let user = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id);

    // Basic User Info
    const joinedAt = user.createdAt;
    const joinedAtServer = member.joinedAt;
    const joinedDiscordTimestamp = Math.floor((Date.now() - joinedAt.getTime()) / (1000 * 60 * 60 * 24)) + ' days';
    const joinedServerTimestamp = Math.floor((Date.now() - joinedAtServer.getTime()) / (1000 * 60 * 60 * 24)) + ' days';


    // Nickname
    const nickname = member.nickname || 'None';

    // Avatar
    const avatarURL = user.displayAvatarURL({ dynamic: true, size: 512 });
    const avatarURL2 = user.displayAvatarURL({ dynamic: true })

    // Boosting Status
    const isBoosting = member.premiumSince ? 'Yes' : 'No';



    // Embed Builder
    const embed = new EmbedBuilder()
        .setAuthor({ name: user.username, iconURL: avatarURL })
        .setThumbnail(avatarURL2)
        .setDescription(
            `**Joined Discord:** ${joinedDiscordTimestamp} ago.\n` +
            `**Joined Server:** ${joinedServerTimestamp} ago.\n` +
            `**Nickname:** ${nickname}\n` +
            `**Boosting:** ${isBoosting}\n`
        )
        .addFields(
            { name: 'Account Created', value: joinedAt.toDateString(), inline: true },
            { name: 'Server Joined', value: joinedAtServer.toDateString(), inline: true }
        )
        .setFooter({ text: 'Developed by Abdullah' })
        .setColor(0x2F3136);

    await interaction.reply({ embeds: [embed] });
}

    {
        if (commandName === 'help'){
            interaction.reply({ content: "Contact: <@1207996343860068353>", ephemeral: true })
        }
    }
    
    if (commandName === 'setstatus') {

        if (!authorizedUserIds.includes(interaction.user.id)) {
            return interaction.reply({ content: "You are not authorized to use this bot's commands.", ephemeral: true });
        }

        const type = interaction.options.getString('type').toLowerCase();
        const status = interaction.options.getString('message');
    
        const activityTypes = {
            playing: ActivityType.Streaming,
            listening: ActivityType.Listening,
            watching: ActivityType.Watching,
            competing: ActivityType.Competing,
            custom: ActivityType.Custom,
        };
    
    
        // Validate activity type
        if (!activityTypes[type]) {
            return interaction.reply({ content: 'Invalid activity type. Please use "playing", "streaming", "listening", "watching", or "competing".', ephemeral: true });
        }
    
        try {
            // Set the bot's presence
            await interaction.client.user.setPresence({
                activities: [{
                    name: status,
                    type: activityTypes[type], // Use the mapped activity type
                }],
            });
    
            await interaction.reply({ content: `Bot status updated to: **${type} ${status}**.`, ephemeral: true });
        } catch (error) {
            console.error('Error setting status:', error);
            await interaction.reply({ content: 'There was an error setting the status.', ephemeral: true });
        }
    }
  
    if (commandName === 'server') {
        const guild = interaction.guild;
        if (!guild) {
            return interaction.reply('This command must be used in a server.');
        }
        const totalChannels = guild.channels.cache.size;
        const totalRoles = guild.roles.cache.size;
        const serverOwner = await guild.fetchOwner();
        const serverOwnerName = serverOwner.displayName || serverOwner.user.username;
        const serverAdmins = guild.members.cache.filter(member => member.permissions.has(PermissionFlagsBits.Administrator)).size;
        const latency = Date.now() - interaction.createdTimestamp;
        const apiLatency = Math.round(client.ws.ping);
        const embed = new EmbedBuilder()
            .setColor(0x2F3136)
            .setAuthor({
                name: guild.name.toUpperCase(),
            })
            .addFields(
                { name: 'Server Owner', value: serverOwnerName, inline: true },
                { name: 'Number of Admins', value: `${serverAdmins}`, inline: true },
                { name: 'Total Channels', value: `${totalChannels}`, inline: true },
                { name: 'Total Roles', value: `${totalRoles}`, inline: true },
                { name: 'Server Created On', value: `${guild.createdAt.toDateString()}` },
                { name: 'Latency', value: `${latency}ms`, inline: true },
                { name: 'API Latency', value: `${apiLatency}ms`, inline: true },
            )
            .setThumbnail(`${guild.iconURL({ dynamic: true, size: 1024 })}`)
            .setFooter({ text: 'Developed By Abdullah' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed]});
    }
   
    
    if (commandName === 'role') {

        if (!authorizedUserIds.includes(interaction.user.id)) {
            return interaction.reply({ content: "You are not authorized to use this bot's commands.", ephemeral: true });
        }
        const user = interaction.options.getUser('user');
        const role = interaction.options.getRole('role');
        const action = interaction.options.getString('action').toLowerCase();
    
        // Fetch the guild member
        const member = await interaction.guild.members.fetch(user.id);
    
        if(error === '50013') {
            interaction.reply({content: "You don't have permission to assign roles to this user", ephemeral: true})
        }

        if (action === 'give') {

            if (!authorizedUserIds.includes(interaction.user.id)) {
                return interaction.reply({ content: "You are not authorized to use this bot's commands.", ephemeral: true });
            }

            if (member.roles.cache.has(role.id)) {
                return interaction.reply({ content: `${user.tag} already has the role ${role.name}.`, ephemeral: true });
            }
            
    
            try {
                await member.roles.add(role);
                return interaction.reply({ content: `${role.name} role has been given to ${user.tag}.`, ephemeral: true });
            } catch (error) {
                if (error.code === 50013) {
                    return interaction.reply({ content: "You don't have permission to assign roles to this user.", ephemeral: true });
                }
                console.error('Error adding role:', error);
                return interaction.reply({ content: `Failed to give the role to ${user.tag}.`, ephemeral: true });
            }
        } else if (action === 'take') {
            if (!member.roles.cache.has(role.id)) {
                return interaction.reply({ content: `${user.tag} does not have the role ${role.name}.`, ephemeral: true });
            }
    
            try {
                await member.roles.remove(role);
                return interaction.reply({ content: `${role.name} role has been removed from ${user.tag}.`, ephemeral: true });
            } catch (error) {
                if (error.code === 50013) {
                    return interaction.reply({ content: "You don't have permission to assign roles to this user.", ephemeral: true });
                }
                console.error('Error removing role:', error);
                return interaction.reply({ content: `Failed to remove the role from ${user.tag}.`, ephemeral: true });
            }
        } else {
            return interaction.reply({ content: 'Invalid action. Please choose either "give" or "take".', ephemeral: true });
        }
        
    }
   
    if (commandName === 'setup') {
    try {
        const user = interaction.user;
        console.log(`[SETUP] Command run by ${user.tag} (${user.id}) in guild ${interaction.guild?.name} (${interaction.guild?.id})`);

        // Owner check
        if (user.id !== process.env.ABDULLAH) {
            console.warn("[SETUP] Unauthorized attempt by:", user.tag, user.id);
            await interaction.reply({ content: '❌ You are not authorized to use this command.', ephemeral: true });
            return;
        }

        // Get options
        const welcomeChannel = options.getChannel('welcome');
        const byeChannel = options.getChannel('bye');
        const memberChannel = options.getChannel('member');
        const rulesChannel = options.getChannel('rules');
        const role = options.getRole('role');

        console.log("[SETUP] Options received:", {
            welcome: welcomeChannel?.id,
            bye: byeChannel?.id,
            member: memberChannel?.id,
            rules: rulesChannel?.id,
            role: role?.id
        });

        // Validate
        if (!welcomeChannel || !byeChannel || !memberChannel || !rulesChannel || !role) {
            console.warn("[SETUP] Missing one or more required options");
            await interaction.reply({ content: '⚠️ All options (welcome, bye, member, rules, role) must be provided.', ephemeral: true });
            return;
        }

        if (!interaction.guild) {
            console.warn("[SETUP] Tried in DM, blocked.");
            await interaction.reply({ content: '⚠️ This command must be used in a server.', ephemeral: true });
            return;
        }

        const guildId = interaction.guild.id;
        const serverName = interaction.guild.name;

        // Save config
        channelBackup[guildId] = {
            serverName,
            WELCOME_CHANNEL: welcomeChannel.id,
            BYE_CHANNEL: byeChannel.id,
            MEMBER_COUNT_CHANNEL_ID: memberChannel.id,
            RULES_CHANNEL: rulesChannel.id,
            DEFAULT_ROLE_ID: role.id,
            savedBy: user.id,
            savedAt: new Date().toISOString()
        };

        console.log("[SETUP] Storing configuration for guild:", guildId, channelBackup[guildId]);

        saveChannelBackup();

        await interaction.reply({ content: '✅ Setup complete! Configuration saved.', ephemeral: true });
        console.log("[SETUP] Setup successful for guild:", guildId);

    } catch (error) {
        console.error("[SETUP] Fatal error during setup command:", error);

        try {
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: '❌ An error occurred during setup. Please try again later.', ephemeral: true });
            } else {
                await interaction.reply({ content: '❌ An error occurred during setup. Please try again later.', ephemeral: true });
            }
        } catch (editError) {
            console.error("[SETUP] Failed to send error reply:", editError);
        }
    }
}
    
    if (commandName === 'banner') {
    let user = interaction.options.getUser('user') || interaction.user;

    try {
        // Acknowledge interaction early
        await interaction.deferReply();

        // Fetch full user to access banner
        user = await interaction.client.users.fetch(user.id, { force: true });

        const banner = user.bannerURL({ size: 2048 });

        if (banner) {
            await interaction.editReply({ files: [banner] });
        } else {
            await interaction.editReply({ content: "This user does not have a banner." });
        }
    } catch (err) {
        console.error(err);

        if (interaction.deferred) {
            await interaction.editReply({ content: "An error occurred while fetching the user." });
        } else {
            await interaction.reply({ content: "An error occurred while fetching the user.", ephemeral: true });
        }
    }
}

    

    if (commandName === 'av') {
        let user = interaction.options.getUser('user') || interaction.user;
        const av = user.displayAvatarURL({ dynamic: true })
        await interaction.reply({ files: [av] });
    }

    if (commandName === 'banlist') {
        try {
            // Fetch all bans in the guild
            const bans = await interaction.guild.bans.fetch();
    
            if (bans.size === 0) {
                return interaction.reply({ content: 'There are no banned users in this server.', ephemeral: true });
            }
    
            // Create an embed for the list of banned users
            const embed = new EmbedBuilder()
                .setTitle('Banned Users')
                .setColor('#ff0000');
    
            // Add each banned user to the embed
            let description = '';
            bans.forEach((ban) => {
                const { user, reason } = ban;
                description += `${user.tag} (ID: ${user.id}) - ${user.bot ? '🤖 Bot' : '👤 User'}\n`;
                if (reason) description += `Reason: ${reason}\n`;
                description += '\n';
            });
    
            embed.setDescription(description);
    
            // Send the embed
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error('Error fetching bans:', error);
            interaction.reply({ content: 'There was an error fetching the list of banned users.', ephemeral: true });
        }
    }

    // if (commandName === 'play') {
    //     await interaction.deferReply();
    //     const url = options.getString('url');
    //     const voiceChannel = interaction.member.voice.channel;
    
    //     if (!voiceChannel) {
    //         return interaction.editReply('You need to be in a voice channel to play music!');
    //     }
    
    //     try {
    //         const cookiesPath = path.resolve('./cookies.txt'); // Ensure cookies file exists
    //         exec(`yt-dlp --cookies-from-browser firefox --get-title ${url}`, async (err, stdout) => {
    //             if (err) {
    //                 console.error('Error fetching metadata:', err);
    //                 return interaction.editReply('Could not retrieve track information.');
    //             }
    
    //             const title = stdout.trim();
    
    //             connection = joinVoiceChannel({
    //                 channelId: voiceChannel.id,
    //                 guildId: interaction.guild.id,
    //                 adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    //             });
    
    //             const ytProcess = spawn('yt-dlp', ['--cookies', cookiesPath, '-o', '-', '-f', 'bestaudio', url], {
    //                 stdio: ['ignore', 'pipe', 'ignore'],
    //             });
    
    //             const resource = createAudioResource(ytProcess.stdout);
    //             player.play(resource);
    
    //             connection.subscribe(player);
    
    //             const row = new ActionRowBuilder()
    //                 .addComponents(
    //                     new ButtonBuilder().setCustomId('pause').setLabel('Pause').setStyle(ButtonStyle.Primary),
    //                     new ButtonBuilder().setCustomId('stop').setLabel('Stop').setStyle(ButtonStyle.Danger)
    //                 );
    
    //             nowPlayingMessage = await interaction.editReply({ content: `Now Playing: **${title}**`, components: [row] });
    //         });
    //     } catch (error) {
    //         console.error(error);
    //         interaction.editReply('There was an error playing the requested audio.');
    //     }
    // }
    
    
    
    
      
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
  
    const buttonId = interaction.customId;
  
    // Handle the 'premium' button press
    if (buttonId === 'premium') {
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('rateme')
            .setLabel('Love it ❤')
            .setStyle(ButtonStyle.Primary),
        );
  
      await interaction.reply({ components: [row], ephemeral: true });
    }
  
    // Handle the 'rateme' button press
    else if (buttonId === 'rateme') {
      interaction.reply({ content: 'Thank You', ephemeral: true });
    }
  
    // Handle playback control buttons
    // else if (buttonId === 'pause') {
    //     player.pause();
        
    //     // Create Resume button
    //     const row = new ActionRowBuilder()
    //         .addComponents(
    //             new ButtonBuilder().setCustomId('resume').setLabel('Resume').setStyle(ButtonStyle.Success),
    //             new ButtonBuilder().setCustomId('stop').setLabel('Stop').setStyle(ButtonStyle.Danger)
    //         );
    // } else if (buttonId === 'resume') {
    //     player.unpause();

    //     // Create Pause button
    //     const row = new ActionRowBuilder()
    //         .addComponents(
    //             new ButtonBuilder().setCustomId('pause').setLabel('Pause').setStyle(ButtonStyle.Primary),
    //             new ButtonBuilder().setCustomId('stop').setLabel('Stop').setStyle(ButtonStyle.Danger)
    //         );
    // } else if (buttonId === 'stop') {
    //     player.stop();
    //     if (connection) connection.destroy();

    //     // Delete the "Now Playing" message
    //     if (nowPlayingMessage) {
    //         await nowPlayingMessage.delete();
    //     }

    //     // Send a follow-up message indicating stop
    //     await interaction.reply({ content: 'Playback stopped and bot disconnected.', ephemeral: true });
    // }
    
  });
  

client.login(process.env.DISCORD_TOKEN);