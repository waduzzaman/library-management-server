const express = require( 'express' );
const cors = require( 'cors' );
require( 'dotenv' ).config();
const { MongoClient, ServerApiVersion, ObjectId } = require( 'mongodb' );
const { validationResult } = require( 'express-validator' );




const app = express();
const port = process.env.PORT || 5001;



// Middleware

app.use(
    cors( {
        origin: [
            "http://localhost:5173",
            "https://community-library-server.vercel.app",
            "https://community-library-d20f8.web.app",
            "https://community-library-d20f8.firebaseapp.com"
        ],
        credentials: true,
    } )
);

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





        // at least an `updatedAt` timestamp. Returns the updated document as JSON.

        app.get( "/books/:id", async ( req, res ) =>
        {
            console.log( req.params.id );
            const result = await booksCollection.findOne( {
                _id: new ObjectId( req.params.id ),
            } );

            console.log( result );
            res.send( result );
        } )

        // Update a  specific book based on its ID. 
        app.put( "/updateBooks/:id", async ( req, res ) =>
        {
            console.log( req.params.id );
            const query = { _id: new ObjectId( req.params.id ) };
            const data = {
                $set: {
                    image: req.body.image,
                    name: req.body.name,
                    quantity: req.body.quantity,
                    author: req.body.author,
                    category: req.body.category,
                    description: req.body.description,
                    ratings: req.body.ratings,
                    content: req.body.content
                }
            }

            const result = await booksCollection.updateOne( query, data )
            console.log( result );
            res.send( result )

        } )

        // Delete a book by id
        app.delete( '/delete/:id', async ( req, res ) =>
        {

            const result = await booksCollection.deleteOne( { _id: new ObjectId( req.params.id ) } );
            console.log( result );
            res.send( result );
        } );


        // Borrowed book methods: 

          // Collection for Borrow
          const borrowCollection = client.db( 'borrowDB' ).collection( 'borrow' );

        // get borrowed book: 

        app.post('/books/:id/borrow', async (req, res) => {
            try {
                const bookId = req.params.id;
                const { returnDate, userEmail, userName } = req.body;
        
                // Validate returnDate if necessary
                // ...
        
                // Update book quantity using $inc operator
                await booksCollection.updateOne(
                    { _id: ObjectId(bookId) },
                    { $inc: { quantity: -1 } }
                );
        
                // Add book to Borrowed Books collection or update existing record
                await borrowedBooksCollection.insertOne({
                    bookId: ObjectId(bookId),
                    returnDate,
                    userEmail,
                    userName
                });
        
                res.status(200).json({ message: 'Book borrowed successfully' });
            } catch (error) {
                console.error('Error borrowing book:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });
        

      
// // 
//         app.post('/books/:id/borrow', async (req, res) => {
//             try {
//                 const errors = validationResult(req);
//                 if (!errors.isEmpty()) {
//                     return res.status(400).json({ errors: errors.array() });
//                 }
        
//                 const bookId = req.params.id;
//                 const { returnDate, userEmail, userName } = req.body;
        
//                 // Validate returnDate
//                 if (!isValidDate(returnDate)) {
//                     return res.status(400).json({ message: 'Invalid return date' });
//                 }
        
//                 // Update book quantity using $inc operator
//                 await Book.findByIdAndUpdate(bookId, { $inc: { quantity: -1 } });
        
//                 // Add book to Borrowed Books collection or update existing record
//                 await BorrowedBook.findOneAndUpdate(
//                     { bookId, userEmail },
//                     { returnDate, userName },
//                     { upsert: true }
//                 );
        
//                 res.status(200).json({ message: 'Book borrowed successfully' });
//             } catch (error) {
//                 console.error('Error borrowing book:', error);
//                 res.status(500).json({ message: 'Internal server error' });
//             }
//         });
        
        function isValidDate(dateString) {
            // Implement your date validation logic here
            // Return true if the date is valid, false otherwise
        }


        // Return book functions:
        app.get( '/borrowed-books', async ( req, res ) =>
            {
                try
                {
                    const userEmail = req.query.userEmail;
                    // Query the database to find borrowed books for the user
                    const borrowedBooks = await BorrowedBook.find( { userEmail } );
                    res.json( borrowedBooks );
                } catch ( error )
                {
                    console.error( 'Error fetching borrowed books:', error );
                    res.status( 500 ).send( 'Internal server error' );
                }
            } );


        app.post( '/books/:id/return', async ( req, res ) =>
        {
            try
            {
                const bookId = req.params.id;
                const { userEmail } = req.body;

                // Update book quantity using $inc operator
                await Book.findByIdAndUpdate( bookId, { $inc: { quantity: 1 } } );

                // Remove book from Borrowed Books collection
                await BorrowedBook.findOneAndDelete( { bookId, userEmail } );

                res.status( 200 ).send( 'Book returned successfully' );
            } catch ( error )
            {
                console.error( 'Error returning book:', error );
                res.status( 500 ).send( 'Internal server error' );
            }
        } );

        app.post("/books/:id/borrow", async (req, res) => {
            try {
              const { id } = req.params;
              const { returnDate, userEmail, userName } = req.body;
          
              // Your borrowing logic here
              // Example: Update book quantity, add borrowing record to the database, etc.
          
              res.status(200).json({ message: "Book borrowed successfully" });
            } catch (error) {
              console.error("Error borrowing book:", error);
              res.status(500).json({ message: "Internal server error" });
            }
          });
          



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
        // Ensure that the client will close when you finish/but we need to close
        // await client.close();
    }
}

run().catch( console.dir );
