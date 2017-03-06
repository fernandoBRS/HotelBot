// This loads the environment variables from the .env file
require('dotenv-extended').load();

var restify = require('restify');
var builder = require('botbuilder');
var store = require('./models/store');
var spellService = require('./models/cognitive-services/spell-check');
var analyticsService = require('./models/cognitive-services/text-analytics');
var webLanguageService = require('./models/cognitive-services/web-language');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();

server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

// LUIS
const LuisModelUrl = process.env.LUIS_MODEL_URL;

//=========================================================
// Bot Dialogs
//=========================================================

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);

bot.dialog('/', new builder.IntentDialog({ recognizers: [recognizer] })
    .matches('SearchHotels', [
        function (session, args, next) {
            session.send('Welcome to the Hotels finder! We are analyzing your message: \'%s\'', session.message.text);

            // try extracting entities
            var cityEntity = builder.EntityRecognizer.findEntity(args.entities, 'builtin.geography.city');
            var airportEntity = builder.EntityRecognizer.findEntity(args.entities, 'AirportCode');

            if (cityEntity) {
                // city entity detected, continue to next step
                session.dialogData.searchType = 'city';
                next({ response: cityEntity.entity });
            } else if (airportEntity) {
                // airport entity detected, continue to next step
                session.dialogData.searchType = 'airport';
                next({ response: airportEntity.entity });
            } else {
                // no entities detected, ask user for a destination
                builder.Prompts.text(session, 'Please enter your destination');
            }
        },
        function (session, results) {
            var destination = results.response;
            var message = 'Looking for hotels';

            if (session.dialogData.searchType === 'airport') {
                message += ' near %s airport...';
            } else {
                message += ' in %s...';
            }

            session.send(message, destination);

            // Async search
            store.searchHotels(destination).then((hotels) => {
                // args
                session.send('I found %d hotels:', hotels.length);

                var message = new builder.Message()
                    .attachmentLayout(builder.AttachmentLayout.carousel)
                    .attachments(hotels.map(hotelAsAttachment));

                session.send(message);

                // End
                session.endDialog();
            });
        }
    ])
    .matches('ShowHotelsReviews', (session, args) => {
        // retrieve hotel name from matched entities
        var hotelEntity = builder.EntityRecognizer.findEntity(args.entities, 'Hotel');

        if (hotelEntity) {
            session.send('Looking for reviews of \'%s\'...', hotelEntity.entity);

            store.searchHotelReviews(hotelEntity.entity).then((reviews) => {
                var message = new builder.Message()
                    .attachmentLayout(builder.AttachmentLayout.carousel)
                    .attachments(reviews.map(reviewAsAttachment));

                session.send(message);
            });
        }
    })
    .matches('Feedbacks', [
        function (session) {
            if (process.env.IS_TEXT_ANALYTICS_ENABLED === 'true') {
                builder.Prompts.text(session, 'What is your feedback?');
            } else {
                session.send('Sorry, feedback session is under maintenance. Please try again later.');
                session.endDialog();
            }
        },
        function (session, results, next) {
            analyticsService.getScore(results.response).then(score => {
                session.send("Thank your for the feedback! Your score is %s", score);

                var newScore = parseFloat(score);

                if (!isNaN(newScore)) {
                    if (newScore > 0.9) {
                        session.send('I am happy to know you are very satisfied =)');
                    } 
                    else if (newScore > 0.5) {
                        session.send('I am happy to know you are satisfied and I will work to improve your satisfaction =)');
                    } 
                    else {
                        session.send('I am sorry about your bad experience =(');
                    }
                }

                next();
            })
            .catch((error) => {
                console.error(error);
                next();
            });
        }
    ])
    .matches('Help', 
        builder.DialogAction.send('Hi! Try asking me things like \'search hotels in Seattle\', \'search hotels near LAX airport\' or \'show me the reviews of The Bot Resort\''))
    .onDefault((session) => {
        session.send('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance.', session.message.text);
    }));

if (process.env.IS_SPELL_CORRECTION_ENABLED === 'true') {
    bot.use({
        botbuilder: function (session, next) {
            spellService.getCorrectedText(session.message.text).then(text => {
                session.message.text = text;
                next();
            })
            .catch((error) => {
                console.error(error);
                next();
            });
        }
    });
}

if (process.env.IS_WEB_LANGUAGE_ENABLED === 'true') {
    bot.use({
        botbuilder: function (session, next) {
            webLanguageService.breakIntoWords(session.message.text).then(text => {
                session.message.text = text;
                next();
            })
            .catch((error) => {
                console.error(error);
                next();
            });
        }
    });
}

//=========================================================
// Helpers
//=========================================================

function hotelAsAttachment(hotel) {
    return new builder.HeroCard()
        .title(hotel.name)
        .subtitle('%d stars. %d reviews. From $%d per night.', hotel.rating, hotel.numberOfReviews, hotel.priceStarting)
        .images([new builder.CardImage().url(hotel.image)])
        .buttons([
            new builder.CardAction()
                .title('More details')
                .type('openUrl')
                .value('https://www.bing.com/search?q=hotels+in+' + encodeURIComponent(hotel.location))
        ]);
}

function reviewAsAttachment(review) {
    return new builder.ThumbnailCard()
        .title(review.title)
        .text(review.text)
        .images([new builder.CardImage().url(review.image)]);
}