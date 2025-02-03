import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from './firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import './dashboard.css';
const BOOKS_DOC_ID = process.env.REACT_APP_FIRESTORE_BOOKS_DOC_ID;

function Dashboard() {
    const [books, setBooks] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentBook, setCurrentBook] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [draggedItem, setDraggedItem] = useState(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        author: '',
        publishDate: '',
        pageCount: '',
        image: null,
        imagePreview: null
    });

    const initializeBooks = async () => {
        const bookRef = doc(db, 'Books', BOOKS_DOC_ID);
        const docSnap = await getDoc(bookRef);
        if (!docSnap.exists()) {
            await setDoc(bookRef, {
                books: []
            });
        }
    };

    useEffect(() => {
        initializeBooks().then(() => fetchBooks());
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });

        return () => unsubscribe();
    }, []);

    const fetchBooks = async () => {
        try {
            const bookRef = doc(db, 'Books', BOOKS_DOC_ID);
            const docSnap = await getDoc(bookRef);

            if (docSnap.exists()) {
                const booksData = docSnap.data().books || [];
                console.log('Fetched books:', booksData);
                setBooks(booksData);
            } else {
                console.log('No books found');
                setBooks([]);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            alert('An error occurred while uploading the books!');
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedBooks = React.useMemo(() => {
        let sortedItems = [...books];
        if (sortConfig.key) {
            sortedItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortedItems;
    }, [books, sortConfig]);

    const handleDragStart = (e, book) => {
        setDraggedItem(book);
        e.target.classList.add('table-row-dragging');
    };

    const handleDragEnd = (e) => {
        e.target.classList.remove('table-row-dragging');
        setDraggedItem(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, targetBook) => {
        e.preventDefault();
        if (!draggedItem || draggedItem.id === targetBook.id) return;

        const newBooks = [...books];
        const draggedIndex = books.findIndex(book => book.id === draggedItem.id);
        const targetIndex = books.findIndex(book => book.id === targetBook.id);

        newBooks.splice(draggedIndex, 1);
        newBooks.splice(targetIndex, 0, draggedItem);

        setBooks(newBooks);
    };

    const handleImageDrop = (e) => {
        e.preventDefault();
        e.target.classList.remove('dragging');

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageSelect(file);
        }
    };

    const handleImageDragOver = (e) => {
        e.preventDefault();
        e.target.classList.add('dragging');
    };

    const handleImageDragLeave = (e) => {
        e.target.classList.remove('dragging');
    };

    const handleImageSelect = (file) => {
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('The file size must be smaller than 5MB!');
                return;
            }

            if (!file.type.startsWith('image/')) {
                alert('Please select a valid image file!');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({
                    ...formData,
                    image: file,
                    imagePreview: reader.result
                });
                console.log('Image selected and converted to base64');
            };
            reader.onerror = () => {
                console.error('FileReader error');
                alert('The image could not be read!');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!currentBook && !formData.imagePreview) {
                alert('Please select an image!');
                return;
            }

            const bookRef = doc(db, 'Books', BOOKS_DOC_ID);
            const docSnap = await getDoc(bookRef);
            const currentBooks = docSnap.exists() ? docSnap.data().books || [] : [];

            const bookData = {
                id: currentBook?.id || Date.now().toString(),
                title: formData.title,
                author: formData.author,
                PublishDate: parseInt(formData.publishDate.replace(/-/g, '')),
                PageCount: parseInt(formData.pageCount),
                imgUrl: formData.imagePreview || 'https://via.placeholder.com/150'
            };

            let updatedBooks;
            if (currentBook) {
                updatedBooks = currentBooks.map(book =>
                    book.id === currentBook.id ? bookData : book
                );
            } else {
                updatedBooks = [...currentBooks, bookData];
            }

            await updateDoc(bookRef, { books: updatedBooks });
            console.log('Book operation successful');

            setShowModal(false);
            await fetchBooks();
            resetForm();
            alert(currentBook ? 'The book has been updated!' : 'A new book has been added!');
        } catch (error) {
            console.error('Submit error:', error);
            alert('An error occurred during the process!');
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            sessionStorage.removeItem('user');
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this book?')) {
            try {
                const bookRef = doc(db, 'Books', BOOKS_DOC_ID);
                const docSnap = await getDoc(bookRef);

                if (docSnap.exists()) {
                    const currentBooks = docSnap.data().books || [];
                    const updatedBooks = currentBooks.filter(book => book.id !== id);
                    await updateDoc(bookRef, { books: updatedBooks });
                    await fetchBooks();
                    alert('The book has been successfully deleted!');
                }
            } catch (error) {
                console.error('Delete error:', error);
                alert('An error occurred during the deletion process!');
            }
        }
    };

    const handleEdit = (book) => {
        setCurrentBook(book);
        setFormData({
            title: book.title,
            author: book.author,
            publishDate: book.PublishDate ? book.PublishDate.toString().replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : '',
            pageCount: book.PageCount.toString(),
            image: null,
            imagePreview: book.imgUrl
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            author: '',
            publishDate: '',
            pageCount: '',
            image: null,
            imagePreview: null
        });
        setCurrentBook(null);
    };

    return (
        <div className="dashboard-container">
            <div className="sidebar">
                <h2>Book Management</h2>
                <div className="sidebar-menu">
                    <div className="menu-item" onClick={() => {
                        setShowModal(true);
                        resetForm();
                    }}>
                        Add New Book
                    </div>
                </div>
            </div>

            <div className="main-content">
                <div className="navbar">
                    <button className="logout-btn" onClick={handleLogout}>
                        Log Out
                    </button>
                </div>

                <div className="content-area">
                    <div className="table-container">
                        <div className="table-header">
                            <input
                                type="text"
                                placeholder="Search for a book or author..."
                                className="search-bar"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <table className="books-table">
                            <thead>
                                <tr>
                                    <th>Image</th>
                                    <th
                                        className={`sort-header ${sortConfig.key === 'title' ? sortConfig.direction : ''}`}
                                        onClick={() => handleSort('title')}
                                    >
                                        Book Name
                                    </th>
                                    <th
                                        className={`sort-header ${sortConfig.key === 'author' ? sortConfig.direction : ''}`}
                                        onClick={() => handleSort('author')}
                                    >
                                        Author
                                    </th>
                                    <th
                                        className={`sort-header ${sortConfig.key === 'publishDate' ? sortConfig.direction : ''}`}
                                        onClick={() => handleSort('publishDate')}
                                    >
                                        Publish Date
                                    </th>
                                    <th
                                        className={`sort-header ${sortConfig.key === 'pageCount' ? sortConfig.direction : ''}`}
                                        onClick={() => handleSort('pageCount')}
                                    >
                                        Page Count
                                    </th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedBooks
                                    .filter(book =>
                                        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        book.author.toLowerCase().includes(searchTerm.toLowerCase())
                                    )
                                    .map(book => (
                                        <tr
                                            key={book.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, book)}
                                            onDragEnd={handleDragEnd}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, book)}
                                        >
                                            <td>
                                                <img
                                                    src={book.imgUrl}
                                                    alt={book.title}
                                                    className="book-image"
                                                />
                                            </td>
                                            <td>{book.title}</td>
                                            <td>{book.author}</td>
                                            <td>{book.PublishDate ? book.PublishDate.toString().replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : ''}</td>
                                            <td>{book.PageCount}</td>
                                            <td className="action-buttons">
                                                <button
                                                    className="edit-btn"
                                                    onClick={() => handleEdit(book)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="delete-btn"
                                                    onClick={() => handleDelete(book.id)}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>{currentBook ? 'Edit Book' : 'Add New Book'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Book Name</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    minLength={2}
                                    maxLength={100}
                                />
                            </div>
                            <div className="form-group">
                                <label>Author</label>
                                <input
                                    type="text"
                                    value={formData.author}
                                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                    required
                                    minLength={2}
                                    maxLength={100}
                                />
                            </div>
                            <div className="form-group">
                                <label>Publish Date</label>
                                <input
                                    type="date"
                                    value={formData.publishDate}
                                    onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Page Count</label>
                                <input
                                    type="number"
                                    value={formData.pageCount}
                                    onChange={(e) => {
                                        const value = Math.max(0, parseInt(e.target.value) || 0);
                                        setFormData({ ...formData, pageCount: value.toString() });
                                    }}
                                    required
                                    min="1"
                                    onKeyDown={(e) => {
                                        if (e.key === '-') {
                                            e.preventDefault();
                                        }
                                    }}
                                />
                            </div>
                            <div className="form-group">
                                <label>Book Image</label>
                                <div
                                    className="drag-drop-area"
                                    onClick={() => fileInputRef.current.click()}
                                    onDrop={handleImageDrop}
                                    onDragOver={handleImageDragOver}
                                    onDragLeave={handleImageDragLeave}
                                >
                                    {formData.imagePreview ? (
                                        <img src={formData.imagePreview} alt="Preview" style={{ maxHeight: '200px' }} />
                                    ) : (
                                        <p>Click or drag to upload an image</p>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        accept="image/*"
                                        onChange={(e) => handleImageSelect(e.target.files[0])}
                                    />
                                </div>
                            </div>
                            <div className="form-buttons">
                                <button type="submit" className="create-btn">
                                    {currentBook ? 'Edit' : 'Add'}
                                </button>
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;