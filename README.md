# HotelBot

HotelBot is a demo project focused on the integration of some Cognitive Services APIs with Bot Framework.

## Available Cognitive Services APIs

* Language Understanding Intelligent Service (LUIS)
* Bing Spell Check API
* Text Analytics API
* Web Language Model API

## Environment settings

In the **.env** file, there are some settings for Cognitive Services APIs and Bot Framework. 

* Each API has its own flag for enabling or disabling the service and an API key (except LUIS, that uses an URL).
* For Bot Framework

## 1. Using LUIS

Run the **app.js** file and make an HTTP connection through the Bot Framework Emulator.<br>
For more information about the LUIS settings, please check out the [LUIS Bot Sample](https://github.com/Microsoft/BotBuilder-Samples/tree/master/Node/intelligence-LUIS).

## 2. About the APIs

* The Bing Spell Check API is used in this bot to verify and correct words for every user input.
* The Text Analytics API is used for sentiment analysis. When the user wants to provide a feedback, this service is used to check how satisfied the user is according to the message sent.
* The Web Language Model API is used to break a string into words when the user doesn't do it correctly.

## 2. Cognitive Services package

In the folder **models/cognitive-services** you will find javascript files for each Cognitive Services API. 
In the **app.js** file, all models are called for different purposes as described below.



