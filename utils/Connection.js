const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://discordbot:" + process.env.DATABASE_PASSWORD + "@botcluster.1j2yr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const databaseClient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
async function run() {
    try {
        await databaseClient.connect();
        const database = databaseClient.db('sample_mflix');
        const movies = database.collection('movies');
        // Query for a movie that has the title 'Back to the Future'
        const query = { title: 'Back to the Future' };
        const movie = await movies.findOne(query);
        console.log(movie);
    } finally {
        // Ensures that the client will close when you finish/error
        await databaseClient.close();
    }
}
run().catch(console.dir);