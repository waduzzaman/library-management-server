const express = require( 'express' );
const cors = require( 'cors' );
require( 'dotenv' ).config();
const { MongoClient, ServerApiVersion, ObjectId } = require( 'mongodb' );

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use( cors() );
app.use( express.json() );

// MongoDB connection
const uri = `mongodb+srv://${ process.env.DB_USER }:${ process.env.DB_PASS }@cluster0.nrvepld.mongodb.net`;


async function run ()
{

    const client = new MongoClient( uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    } );
    try
    {
        // Connect the client to the server (optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        await client.db( "admin" ).command( { ping: 1 } );

        // Declare Books Collection
        const booksCollection = client.db( 'booksDB' ).collection( 'books' );


        app.get( '/books', async ( req, res ) =>
        {
            const cursor = booksCollection.find();
            const result = await cursor.toArray();
            res.send( result );
        } );

        // Post / add a book in the database 
        app.post( '/books', async ( req, res ) =>
        {
            const newBooks = req.body;
            console.log( newBooks );
            const result = await booksCollection.insertOne( newBooks );
            res.send( result );
        } )

        // find one book by id and return it as json
        app.get( '/books/:id', async ( req, res ) =>
        {
            const id = req.params.id;
            const query = { _id: new ObjectId( id ) }
            const result = await booksCollection.findOne( query );
            console.log( 'one book found', result );
            res.send( result );
        } )


        // Borrowed book query: 

        app.post( '/books/:id/borrow', async ( req, res ) =>
        {
            try
            {
                const bookId = req.params.id;
                const { returnDate, userEmail, userName } = req.body;

                // Update book quantity using $inc operator
                await Book.findByIdAndUpdate( bookId, { $inc: { quantity: -1 } } );

                // Add book to Borrowed Books collection or update existing record
                await BorrowedBook.findOneAndUpdate(
                    { bookId, userEmail },
                    { returnDate, userName },
                    { upsert: true }
                );

                res.status( 200 ).send( 'Book borrowed successfully' );
            } catch ( error )
            {
                console.error( 'Error borrowing book:', error );
                res.status( 500 ).send( 'Internal server error' );
            }
        } );



        // Collection for programs
        const programsCollection = client.db( 'programsDB' ).collection( 'programs' );

        // Get all programs
        app.get( '/programs', async ( req, res ) =>
        {
            try
            {
                const cursor = programsCollection.find();
                const result = await cursor.toArray();
                res.json( result );
            } catch ( error )
            {
                console.error( 'Error fetching programs:', error );
                res.status( 500 ).json( { error: 'Internal server error' } );
            }
        } );

        // Add a new program
        app.post( '/programs', async ( req, res ) =>
        {
            try
            {
                const newProgram = req.body;
                const result = await programsCollection.insertOne( newProgram );
                res.json( result.ops[ 0 ] ); // Return the inserted document
            } catch ( error )
            {
                console.error( 'Error adding program:', error );
                res.status( 500 ).json( { error: 'Internal server error' } );
            }
        } );

        // Get a program by ID
        app.get( '/programs/:id', async ( req, res ) =>
        {
            try
            {
                const id = req.params.id;
                const query = { _id: new ObjectId( id ) };
                const result = await programsCollection.findOne( query );
                if ( !result )
                {
                    res.status( 404 ).json( { error: 'Program not found' } );
                    return;
                }
                res.json( result );
            } catch ( error )
            {
                console.error( 'Error fetching program by ID:', error );
                res.status( 500 ).json( { error: 'Internal server error' } );
            }
        } );















        // Start the server after setting up routes
        app.listen( port, () =>
        {
            console.log( `Community Library server is running on port: ${ port }` );
        } );
    } catch ( err )
    {
        console.error( "Error connecting to MongoDB:", err );
    } finally
    {
        // Ensure that the client will close when you finish/error
        // await client.close();
    }
}

run().catch( console.dir );
