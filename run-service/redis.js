export async function printRedisMemory() {
    try {
        // Get all keys
        const keys = await redisClient.keys('*');
        console.log('\n=== Redis Memory Contents ===');
        console.log('Total Keys Found:', keys.length);

        // Group keys by type (job: vs other prefixes)
        const jobKeys = keys.filter(key => key.startsWith('job:'));
        const otherKeys = keys.filter(key => !key.startsWith('job:'));

        // Print Job-related data
        if (jobKeys.length > 0) {
            console.log('\n--- Test Runner Jobs ---');
            for (const jobKey of jobKeys) {
                const jobData = await redisClient.hGetAll(jobKey);
                console.log(`\nJob ID: ${jobKey}`);
                console.log('Status:', jobData.complete === 'true' ? 'Complete' : 'In Progress');
                console.log('Question ID:', jobData.questionId);
                console.log('Code Submitted:', jobData.code);
                
                // Parse and format results
                try {
                    const results = JSON.parse(jobData.results);
                    console.log('Test Results:');
                    results.forEach((result, index) => {
                        console.log(`  Test ${index + 1}:`, result);
                    });
                } catch (e) {
                    console.log('Results:', jobData.results);
                }
            }
        }

        // Print other keys
        if (otherKeys.length > 0) {
            console.log('\n--- Other Keys ---');
            for (const key of otherKeys) {
                const type = await redisClient.type(key);
                console.log(`\nKey: ${key} (Type: ${type})`);
                
                switch (type) {
                    case 'hash':
                        const hashData = await redisClient.hGetAll(key);
                        console.log('Hash Contents:', hashData);
                        break;
                    case 'string':
                        const stringData = await redisClient.get(key);
                        console.log('String Value:', stringData);
                        break;
                    // Add cases for other types if needed
                    default:
                        console.log('Unknown type');
                }

                // Get TTL for the key
                const ttl = await redisClient.ttl(key);
                if (ttl > -1) {
                    console.log('TTL:', ttl, 'seconds');
                }
            }
        }

        console.log('\n=== End of Redis Memory Contents ===\n');
    } catch (error) {
        console.error('Error printing Redis memory:', error);
    }
}

// Function to print specific job details
export async function printJobDetails(jobId) {
    try {
        const key = `job:${jobId}`;
        const jobData = await redisClient.hGetAll(key);

        if (Object.keys(jobData).length === 0) {
            console.log(`No job found with ID: ${jobId}`);
            return;
        }

        console.log('\n=== Job Details ===');
        console.log('Job ID:', jobId);
        console.log('Status:', jobData.complete === 'true' ? 'Complete' : 'In Progress');
        console.log('Question ID:', jobData.questionId);
        console.log('Code Submitted:', jobData.code);

        // Parse and format results
        try {
            const results = JSON.parse(jobData.results);
            console.log('\nTest Results:');
            results.forEach((result, index) => {
                console.log(`\nTest ${index + 1}:`);
                console.log('  Test Case ID:', result.testcaseId);
                console.log('  Status:', result.status);
                if (result.output) console.log('  Output:', result.output);
                if (result.error) console.log('  Error:', result.error);
            });
        } catch (e) {
            console.log('Results:', jobData.results);
        }

        const ttl = await redisClient.ttl(key);
        if (ttl > -1) {
            console.log('\nTime to Live:', ttl, 'seconds');
        }

        console.log('\n=== End of Job Details ===\n');
    } catch (error) {
        console.error('Error printing job details:', error);
    }
}

// Function to print summary statistics
export async function printRedisStats() {
    try {
        const keys = await redisClient.keys('*');
        const jobKeys = keys.filter(key => key.startsWith('job:'));
        
        console.log('\n=== Redis Statistics ===');
        console.log('Total Keys:', keys.length);
        console.log('Total Jobs:', jobKeys.length);

        // Count completed vs in-progress jobs
        let completedJobs = 0;
        let inProgressJobs = 0;
        let failedTests = 0;
        let passedTests = 0;

        for (const jobKey of jobKeys) {
            const jobData = await redisClient.hGetAll(jobKey);
            
            if (jobData.complete === 'true') {
                completedJobs++;
            } else {
                inProgressJobs++;
            }

            try {
                const results = JSON.parse(jobData.results || '[]');
                results.forEach(result => {
                    if (result.status === 'completed') passedTests++;
                    if (result.status === 'failed') failedTests++;
                });
            } catch (e) {
                console.error('Error parsing results for job:', jobKey);
            }
        }

        console.log('\nJob Statistics:');
        console.log('Completed Jobs:', completedJobs);
        console.log('In-Progress Jobs:', inProgressJobs);
        console.log('Passed Tests:', passedTests);
        console.log('Failed Tests:', failedTests);
        console.log('\n=== End of Statistics ===\n');
    } catch (error) {
        console.error('Error printing Redis statistics:', error);
    }
}