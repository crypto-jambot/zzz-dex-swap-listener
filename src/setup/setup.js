/*********************************************************************
 * Copyright (C) 2022 Joshua Sells joshuataylorsells@gmail.com
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 *
 * Proprietary and confidential
 *
 *********************************************************************/

import 'dotenv/config';
import Web3 from 'web3';
import settings from '../config/settings.json';
import * as Constants from '../constants/constants';
import { createAlchemyWeb3 } from '@alch/alchemy-web3';

let web3;

// Web3 setup
if (!settings.isLocal) {
    switch (settings.nodeProvider) {
        case 'PastyBOI':
            web3 = new Web3('ws://0.0.0.0:8546');
            break;
        case Constants.ALCHEMY:
            web3 = createAlchemyWeb3(`${Constants.ALCHEMY_WRAPPER_ETH_ENDPOINT}${process.env.ALCHEMY_API_KEY}`, { maxRetries: 100 });
            break;
        case Constants.INFURA:
            web3 = new Web3(`${Constants.INFURA_ETH_ENDPOINT}${process.env.INFURA_API_KEY}`);
            break;
        case Constants.GET_BLOCK_BSC:
            web3 = new Web3(`${Constants.GET_BLOCK_BSC_ENDPOINT}${process.env.GET_BLOCK_API_KEY}`);
            break;
        case Constants.CHAINSTACK_BSC:
            web3 = new Web3(Constants.CHAINSTACK_BSC_ENDPOINT);
            break;
        case Constants.CHAINSTACK_POLYGON:
            web3 = new Web3(Constants.CHAINSTACK_POLYGON_ENDPOINT);
            break;
        case Constants.QUICKNODE_BSC:
            web3 = new Web3(Constants.QUICKNODE_BSC_ENDPOINT);
            break;
        case Constants.MORALIS_BSC:
            web3 = new Web3(Constants.MORALIS_BSC_ENDPOINT);
            break;
        default:
            web3 = new Web3(Constants.LOCALHOST_ETH_ENDPOINT);
    }
} else {
    web3 = new Web3(Constants.LOCALHOST_ETH_ENDPOINT);
}

export { web3 };
