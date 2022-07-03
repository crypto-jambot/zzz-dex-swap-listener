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
    if (settings.nodeProvider == Constants.ALCHEMY) {
        web3 = createAlchemyWeb3(
            `${Constants.ALCHEMY_WRAPPER_ETH_ENDPOINT}${process.env.ALCHEMY_API_KEY}`,
            { maxRetries: 100 }
        );
    } else {
        web3 = new Web3(`${Constants.INFURA_ETH_ENDPOINT}${process.env.INFURA_API_KEY}`);
    }
} else {
    web3 = new Web3(Constants.LOCALHOST_ETH_ENDPOINT);
}

export { web3 };
