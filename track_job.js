const { loadTracked, saveTracked, removeJobFromActiveLists } = require('./src/store');

/**
 * Tracks a job link with a status.
 * Usage: node track_job.js "https://example.com/job" "applied"
 */
function trackJob() {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.error('Usage: node track_job.js <link> [status]');
        process.exit(1);
    }

    const link = args[0];
    const status = args[1] || 'visited'; // default status

    const tracked = loadTracked();
    tracked[link] = {
        status: status,
        date: new Date().toISOString().split('T')[0]
    };

    saveTracked(tracked);
    removeJobFromActiveLists(link);
    console.log(`Tracked job as "${status}": ${link}`);
}

trackJob();
