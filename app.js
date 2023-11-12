const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Połączenie z bazą danych MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'testdatabase',
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

class Book {
  constructor(Id, Title, Description, Pages, ReleaseDate) {
    this.Id = Id;
    this.Title = Title;
    this.Description = Description;
    this.Pages = Pages;
    this.ReleaseDate = ReleaseDate;
  }
}

//View model
const bookViewModel = {
  getAllBooks: (callback) => {
    connection.query('SELECT * FROM books', (error, results) => {
      if (error) {
        console.error('Error fetching books:', error);
        callback([]);
      } else {
        const books = results.map(result => new Book(result.Id, result.Title, result.Description, result.Pages, result.ReleaseDate));
        callback(books);
      }
    });
  },
  getBookById: (id, callback) => {
    connection.query('SELECT * FROM books WHERE Id = ?', [id], (error, results) => {
      if (error) {
        console.error('Error fetching book by ID:', error);
        callback(null);
      } else {
        if (results.length === 1) {
          const book = new Book(results[0].Id, results[0].Title, results[0].Description, results[0].Pages, results[0].ReleaseDate);
          callback(book);
        } else {
          callback(null);
        }
      }
    });
  },
  addBook: (book, callback) => {
    if(book.Pages < 1)
    {
        console.error('Error adding book:', error);
        callback(null);
        return;
    }

    connection.query('INSERT INTO books SET ?', book, (error, results) => {
      if (error) {
        console.error('Error adding book:', error);
        callback(null);
      } else {
        callback(results.insertId);
      }
    });
  },
  updateBook: (id, updatedBook, callback) => {
    connection.query('UPDATE books SET ? WHERE Id = ?', [updatedBook, id], (error) => {
      if (error) {
        console.error('Error updating book:', error);
        callback(false);
      } else {
        callback(true);
      }
    });
  },
  deleteBook: (id, callback) => {
    connection.query('DELETE FROM books WHERE Id = ?', [id], (error) => {
      if (error) {
        console.error('Error deleting book:', error);
        callback(false);
      } else {
        callback(true);
      }
    });
  },
};

//Kontroller
app.get('/', (req, res) => {
    bookViewModel.getAllBooks((books) => {
    res.render('index', { books });
  });
});

app.get('/book/:Id', (req, res) => {
  const Id = parseInt(req.params.Id);
  bookViewModel.getBookById(Id, (book) => {
    if (book) {
      res.render('book', { book });
    } else {
      res.status(404).send('Book not found');
    }
  });
});

app.post('/book', (req, res) => {
  const newBook = req.body;
  bookViewModel.addBook(newBook, (insertId) => {
    res.redirect('/');
  });
});

app.post('/book/:Id', (req, res) => {
  const Id = parseInt(req.params.Id);
  const updatedBook = req.body;
  bookViewModel.updateBook(Id, updatedBook, () => {
    res.redirect('/book/' + Id);
  });
});

app.post('/book/:Id/delete', (req, res) => {
  const Id = parseInt(req.params.Id);
  bookViewModel.deleteBook(Id, () => {
    res.redirect('/');
  });
});

app.use((req, res, next) => {
    res.status(404).send('404 Not Found');
});

// Obsługa ogólnych błędów
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('500 Internal Server Error');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});