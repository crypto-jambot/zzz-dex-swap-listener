require("dotenv").config();
const Web3 = require('web3');
const settings = require('./config/settings.json');
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");

let web3;

// Web3 setup
if (!settings.isLocal) {
    if (settings.nodeProvider == "ALCHEMY") {
        if (settings.useAlchemyWrapper) {
            web3 = createAlchemyWeb3(
                `wss://eth-mainnet.ws.alchemyapi.io/ws/${process.env.ALCHEMY_API_KEY}`,
                { maxRetries: 100 }
            );
        } else {
            web3 = new Web3(`wss://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`)
        }
    } else {
        web3 = new Web3(`wss://mainnet.infura.io/ws/v3/${process.env.INFURA_API_KEY}`);
    }
} else {
    web3 = new Web3('ws://127.0.0.1:7545')
}

module.exports = {
    web3
}