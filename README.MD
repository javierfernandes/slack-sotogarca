# Slack Bot: Sotogarca

Listens for messages with certain pattern and text, and replies with an template image processed to include the text
on it.

## Usage

The bot currently supports the following messages:

```
sotogarca: a message here
cronica: a message here
comunicado: a message here
```

It also automatically break text in parts for fitting the image width.

## Installation MacOS

* npm install
* brew install graphicsmagick
* brew install ghostscript
* sudo ln -s /usr/local/Cellar/ghostscript/9.16/share/ghostscript /usr/local/share/ghostscript


## Installation in Linux

* npm install
* sudo apt-get install graphicsmagick
* sudo apt-get install ghostscript

## Configuration

Setup your api key in run.js

## Start the bot

```
node run.js
```
