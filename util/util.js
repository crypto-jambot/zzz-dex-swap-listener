const queryTokens = async (bigQuery) => {
    const query = 'SELECT * FROM `crypto-351521.ethereum.arbitrageable_pairs`';

    // For all options, see https://cloud.google.com/bigquery/docs/reference/rest/v2/jobs/query
    const options = {
        query: query,
        // Location must match that of the dataset(s) referenced in the query.
        location: 'US',
    };

    // Run the query as a job
    const [ job ] = await bigQuery.createQueryJob(options);
    console.log(`Job ${job.id} started.`);

    // Wait for the query to finish
    const [ rows ] = await job.getQueryResults();
    
    return rows;
}

module.exports = {
    queryTokens
}