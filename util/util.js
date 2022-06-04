const queryPairs = async (bigQuery, queryString) => {
    const options = {
        query: queryString,
        location: 'US',
    };
    const [ job ] = await bigQuery.createQueryJob(options);
    const [ rows ] = await job.getQueryResults();
    console.log("BigQuery Job finished.");
    return rows;
}

module.exports = {
    queryPairs
}