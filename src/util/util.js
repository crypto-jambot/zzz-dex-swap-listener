/*********************************************************************
 * Copyright (C) 2022 Joshua Sells joshuataylorsells@gmail.com
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 *
 * Proprietary and confidential
 *
 *********************************************************************/

import 'dotenv/config';
import { BigQuery } from '@google-cloud/bigquery';
import settings from '../config/settings.json';

export const queryPairs = async () => {
    const queryString = `SELECT * FROM \`${process.env.BIGQUERY_PROJECT}.${settings.bqDataset}.${settings.bqTable}\``;
    return await query(queryString);
};

const query = async (queryString) => {
    const bigQuery = new BigQuery();
    const options = {
        query: queryString,
        location: 'US',
    };
    const [job] = await bigQuery.createQueryJob(options);
    const [rows] = await job.getQueryResults();
    return rows;
};

export const getPairContractsForEachPair = (arbitrageablePairs) => {
    return arbitrageablePairs.map((pair) => {
        const pairContracts = [];
        for (const exchange of pair.exchanges) {
            pairContracts.push({
                name: exchange.name,
                pairContract:
                    exchange.pairAddress != null
                        ? new web3.eth.Contract(IUniswapV2Pair.abi, exchange.pairAddress)
                        : null,
            });
        }
        return pairContracts;
    });
};
