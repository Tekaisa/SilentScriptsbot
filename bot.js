const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, ChannelType, ButtonBuilder, ActionRowBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

// Create a new client instance with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// When the client is ready, run this code (once)
client.once('ready', () => {
    console.log('Bot is online and ready to respond!');
});

// Temporary storage for user selections
const userSelections = new Map();
let ticketMessage; // Store the reference to the ticket message

// Function to delay execution
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Command to create a ticket message with payment method buttons
client.on('messageCreate', async message => {
    // Check if the message starts with the command and if the user has the required permissions
    if (message.content.startsWith('!ticketMessage')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Select Payment Method')
            .setDescription('Please select a payment method below.');

        const buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('paypal')
                .setLabel('PayPal')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('crypto')
                .setLabel('Crypto')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('other')
                .setLabel('Other')
                .setStyle(ButtonStyle.Primary)
        );

        // Send the message and store the reference
        ticketMessage = await message.channel.send({ embeds: [embed], components: [buttonRow] });
    }
});

// Handle interactions
client.on('interactionCreate', async interaction => {
    // Log the interaction for debugging
    console.log('Interaction received:', interaction);

    if (interaction.isButton()) {
        const userId = interaction.user.id;
        const selectedButtonId = interaction.customId; // Get the custom ID of the button pressed

        // Check if the button pressed is a payment method button
        if (['paypal', 'crypto', 'other'].includes(selectedButtonId)) {
            // Store the selected payment method
            userSelections.set(userId, { paymentMethod: selectedButtonId });

            // Display cheat type buttons
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Select Cheat Type')
                .setDescription('Please select a cheat type below.');

            const cheatButtonRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('rocket_league_cheat')
                    .setLabel('Rocket League Cheat')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('rocket_league_bot')
                    .setLabel('Rocket League Bot')
                    .setStyle(ButtonStyle.Primary)
            );

            // Send a new ephemeral message to the user
            await interaction.reply({ embeds: [embed], components: [cheatButtonRow], ephemeral: true });
            return;
        }

        // Check if the button pressed is a cheat type button
        if (['rocket_league_cheat', 'rocket_league_bot'].includes(selectedButtonId)) {
            // Retrieve the stored payment method
            const userSelection = userSelections.get(userId);
            if (!userSelection) return;

            // Store the selected cheat type
            userSelection.cheatType = selectedButtonId;

            // Display duration buttons based on the cheat type selected
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Select Duration')
                .setDescription('Please select a duration below.');

            let durationButtonRow;

            if (selectedButtonId === 'rocket_league_cheat') {
                // Buttons for Rocket League Cheat
                durationButtonRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('2_days_cheat')
                        .setLabel('2 Days - 7€')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('1_week_cheat')
                        .setLabel('1 Week - 15€')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('1_month_cheat')
                        .setLabel('1 Month - 25€')
                        .setStyle(ButtonStyle.Primary)
                );
            } else if (selectedButtonId === 'rocket_league_bot') {
                // Buttons for Rocket League Bot
                durationButtonRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('1_day_bot')
                        .setLabel('1 Day - 6€')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('1_week_bot')
                        .setLabel('1 Week - 19€')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('1_month_bot')
                        .setLabel('1 Month - 39€')
                        .setStyle(ButtonStyle.Primary)

                );
            }

            await interaction.update({ embeds: [embed], components: [durationButtonRow] });
            return;
        }
        if (interaction.replied || interaction.deferred) {
            console.error("Interaction has already been replied to.");
            return; // Exit if already replied
        }

        // Check if the button pressed is a duration button
        if (['2_days_cheat', '1_week_cheat', '1_month_cheat', '1_day_bot', '1_week_bot', '1_month_bot'].includes(selectedButtonId)) {
            // Retrieve the stored selections
            const userSelection = userSelections.get(userId);
            if (!userSelection || !userSelection.cheatType) return;

            // Store the selected duration
            userSelection.duration = selectedButtonId;

            // Create a unique channel name based on the user's username
            const channelName = `ticket-${interaction.user.username}-${interaction.user.id}`; // Unique channel name
            console.log('Channel Name for ticket:', channelName); // Log the channel name

            try {
                // Create a new ticket channel
                const ticketChannel = await interaction.guild.channels.create({
                    name: channelName, // Use the unique channel name here
                    type: ChannelType.GuildText, // Use ChannelType.GuildText
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id, // @everyone
                            deny: [PermissionsBitField.Flags.ViewChannel], // Deny @everyone from viewing
                        },
                        {
                            id: interaction.user.id, // Allow the user to view
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                        },
                        {
                            id: '1314624892217462947', // Replace with your support role ID
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                        },
                    ],
                });

                // Create a custom embed message summarizing the user's choices
                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Support Ticket Created')
                    .setDescription(`Hello <@${interaction.user.id}>, this is your support ticket regarding:\n- Payment Method: **${userSelection.paymentMethod}**\n- Cheat Type: **${userSelection.cheatType}**\n- Duration: **${userSelection.duration}**`)
                    .setTimestamp();

                await ticketChannel.send({ embeds: [embed] });

                // Add a close button for the admin
                const closeButtonRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('Close Ticket')
                        .setStyle(ButtonStyle.Danger)
                );
                function delay(ms) {
                    return new Promise(resolve => setTimeout(resolve, ms));
                }
                await ticketChannel.send({ content: 'Click the button below to close this ticket:', components: [closeButtonRow] });
                
                userSelections.delete(userId); // Clear the user's selections after ticket creation
               
                await interaction.update({ 
                    content: 'Creating your ticket...', // Provide some content
                    embeds: [], 
                    components: [] 
                });
                
                // Send a follow-up message with the ticket creation confirmation
                const followUpMessage = await interaction.followUp({ 
                    content: `Your ticket has been created: ${ticketChannel}`, 
                    ephemeral: true 
                });
                
                
                
                // Reset the ticket message to the initial state
                if (ticketMessage) {
                    const resetEmbed = new EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle('Select Payment Method')
                        .setDescription('Please select a payment method below.');

                    const resetButtonRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('paypal')
                            .setLabel('PayPal')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('crypto')
                            .setLabel('Crypto')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('other')
                            .setLabel('Other')
                            .setStyle(ButtonStyle.Primary)
                    );

                    await ticketMessage.edit({ embeds: [resetEmbed], components: [resetButtonRow] });
                }
            } catch (error) {
                console.error('Error creating ticket channel:', error);
                await interaction.reply({ content: 'There was an error creating your ticket. Please try again later.', ephemeral: true });
            }
        }

        // Check if the button pressed is the close ticket button
        if (selectedButtonId === 'close_ticket') {
            // Check if the user is an admin
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return await interaction.reply({ content: 'You do not have permission to close this ticket.', ephemeral: true });
            }

            try {
                // Acknowledge the interaction before deleting the channel
                await interaction.reply({ content: 'The ticket is being closed...', ephemeral: true });

                // Close the ticket channel
                await interaction.channel.delete();
            } catch (error) {
                console.error('Error closing the ticket:', error);
                // Check if the channel still exists before replying
                if (interaction.channel) {
                    await interaction.followUp({ content: 'There was an error closing the ticket. Please try again later.', ephemeral: true });
                }
            }
        }
    }
});

// Login to Discord with your app's token
client.login('MTMxMTc5NTgyMTQ0ODI2NTg1MQ.GhKnMZ.9E3A30Kdx8WiOn8_3AHHhdrsFK3coSwo6kSl-s'); // Replace with your actual bot token

