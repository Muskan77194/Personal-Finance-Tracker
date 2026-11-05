
import { useState, useEffect } from 'react'
import './App.css'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
const API_URL = 'http://localhost:5000/api/transactions'
function App() {
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('financeTransactions')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [type, setType] = useState('Income')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Salary')
  const [filterCategory, setFilterCategory] = useState('All')
  const [editingId, setEditingId] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('financeToken') || '');
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  async function handleAuth(event) {
  event.preventDefault();

  const endpoint =
    authMode === 'register'
      ? 'http://localhost:5000/api/auth/register'
      : 'http://localhost:5000/api/auth/login';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || 'Login/Register failed.');
      return;
    }

    if (authMode === 'register') {
      alert('Registration successful! Please login.');
      setAuthMode('login');
      setPassword('');
      return;
    }

    localStorage.setItem('financeToken', data.token);
    setToken(data.token);
    setEmail('');
    setPassword('');
  } catch (error) {
    console.error(error);
    alert('Backend server check karo.');
  }
}
  
  const [showTrash, setShowTrash] = useState(false)
const [trashTransactions, setTrashTransactions] = useState([])
    
useEffect(() => {
  if (!token) return
  fetch(API_URL, {
  headers: {
    'content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
})
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to load transactions')
      }
      return response.json()
    })
    .then((data) => {
      if (Array.isArray(data)) {
        setTransactions(data)
      } else {
        console.error('Unexpected server response:', data)
        setTransactions([])
      }
    })
    .catch((error) => {
      console.error('Error loading transactions:', error)
      setTransactions([])
    })
}, [token])


  const income = transactions
    .filter((item) => item.type === 'Income')
    .reduce((total, item) => total + item.amount, 0)

  const expenses = transactions
    .filter((item) => item.type === 'Expense')
    .reduce((total, item) => total + item.amount, 0)
    const chartData = [
  { name: 'Income', amount: income },
  { name: 'Expenses', amount: expenses },
]
  const filteredTransactions = transactions.filter(
    (item) =>
      filterCategory === 'All' ||
      item.category === filterCategory
  )


async function addTransaction(event) {
  event.preventDefault()

  if (!title.trim() || !amount || Number(amount) <= 0) {
    alert('Please enter a description and a valid amount.')
    return
  }

  const transactionData = {
    title: title.trim(),
    amount: Number(amount),
    type,
    category,
  }
  console.log('Transaction data:', transactionData)
try {
    const url =
      editingId !== null
        ? `${API_URL}/${editingId}`
        : API_URL

    const response = await fetch(url, {
      method: editingId !== null ? 'PUT' : 'POST',
      headers: {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
},
      body: JSON.stringify(transactionData),
    })

    if (!response.ok) {
      throw new Error('Could not save transaction')
    }

    const savedTransaction = await response.json()

    if (editingId !== null) {
      setTransactions((previous) =>
        previous.map((item) =>
          item._id === editingId ? savedTransaction : item
        )
      )
      setEditingId(null)
    } else {
      setTransactions((previous) => [
        ...previous,
        savedTransaction,
      ])
    }

    setTitle('')
    setAmount('')
    setType('Income')
    setCategory('Salary')
  } catch (error) {
    console.error(error)
    alert('Transaction save nahi hui. Backend server check karo.')
  }
}

 
async function deleteTransaction(id) {
  try {
   const response = await fetch(`${API_URL}/${id}`, {
  method: 'DELETE',
  headers: {
    'content-Type': 'application/json',
   Authorization: `Bearer ${token}`,
  },
})

    if (!response.ok) {
      throw new Error('Could not delete transaction')
    }

    setTransactions((previous) =>
      previous.filter((item) => item._id !== id)
    )
  } catch (error) {
    console.error(error)
    alert('Transaction delete nahi hui. Backend server check karo.')
  }
}
 async function loadTrash() {
  try {
   const response = await fetch(`${API_URL}/trash`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

    if (!response.ok) {
      throw new Error('Could not load trash');
    }

    const data = await response.json();
    setTrashTransactions(data);
  } catch (error) {
    console.error('Error loading trash:', error);
    alert('Recycle Bin load nahi ho paya.');
  }
}

async function restoreTransaction(id) {
  try {
    const response = await fetch(`${API_URL}/${id}/restore`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

    if (!response.ok) {
      throw new Error('Could not restore transaction');
    }

    await loadTrash();

    // Restored transaction ko dashboard par bhi reload karna hai
   const updatedResponse = await fetch(API_URL, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
    const updatedData = await updatedResponse.json();
    setTransactions(updatedData);
  } catch (error) {
    console.error('Error restoring transaction:', error);
    alert('Transaction restore nahi hui.');
  }
}
if (!token) {
  return (
    <div className="app">
      <div className="auth-container">
        <h1>MyFinance</h1>
        <h2>{authMode === 'register' ? 'Create Account' : 'Welcome Back'}</h2>
        <p>
          {authMode === 'register'
            ? 'Register to manage your money'
            : 'Login to your finance dashboard'}
        </p>

        <form onSubmit={handleAuth}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          <button type="submit">
            {authMode === 'register' ? 'Register' : 'Login'}
          </button>
        </form>

        <p>
          {authMode === 'register'
            ? 'Already have an account?'
            : "Don't have an account?"}
          <button
            type="button"
            onClick={() =>
              setAuthMode(authMode === 'register' ? 'login' : 'register')
            }
          >
            {authMode === 'register' ? 'Login' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
}

  return (
    <div className="app">
      <header className="topbar">
        <h2>MyFinance</h2>
        <span>Personal Finance Tracker</span>
      </header>

      <main className="dashboard">
        <div className="welcome">
          <p>YOUR MONEY, YOUR CONTROL</p>
          <h1>Finance Dashboard</h1>
          <span>
            Track your income and expenses in one place.
          </span>
          <button
  type="button"
  onClick={() => {
    setShowTrash(true)
    loadTrash()
  }}
>
  Recycle Bin
</button>

<button
  type="button"
  onClick={() => setShowTrash(false)}
>
  Back to Dashboard
</button>
        </div>

        <section className="summary">
          <div className="summary-card balance">
            <p>Total Balance</p>
            <h2>₹{(income - expenses).toLocaleString('en-IN')}</h2>
          </div>

          <div className="summary-card">
            <p>Total Income</p>
            <h2>₹{income.toLocaleString('en-IN')}</h2>
          </div>

          <div className="summary-card">
            <p>Total Expenses</p>
            <h2>₹{expenses.toLocaleString('en-IN')}</h2>
          </div>
        </section>
        
<section className="chart-card">
  <h2>Income vs Expenses</h2> <div style={{ width: '100%', height: 280 }}>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip
          formatter={(value) =>
            `₹${Number(value).toLocaleString('en-IN')}`
          }
        />
        <Bar
          dataKey="amount"
          fill="#3867e8"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
</section>

        <section className="content">
          <form
         
         className="transaction-form"
            onSubmit={addTransaction}
          >
           <h2>{editingId !== null ? 'Edit Transaction' : 'Add Transaction'}</h2>

            <label>Transaction type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option>Income</option>
              <option>Expense</option>
            </select>

            <label>Description</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Monthly salary"
            />

            <label>Amount (₹)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />

            <label>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option>Salary</option>
              <option>Food</option>
              <option>Shopping</option>
              <option>Rent</option>
              <option>Travel</option>
              <option>Education</option>
              <option>Other</option>
            </select>
            <button type="submit">
  {editingId !== null ? 'Update Transaction' : '+ Add Transaction'}
</button>  
          </form>

          
<section className="history">
  <h2>{showTrash ? 'Recycle Bin' : 'Recent Transactions'}</h2>

  {showTrash ? (
    <div>
      {trashTransactions.length === 0 ? (
        <p className="empty">Recycle Bin is empty.</p>
      ) : (
        trashTransactions.map((item) => (
          <div className="transaction" key={item._id}>
            <div>
              <strong>{item.title}</strong>
              <p>{item.category} · {item.date}</p>
            </div>

            <div className="transaction-amount">
              <strong
                className={item.type === 'Income' ? 'positive' : 'negative'}
              >
                {item.type === 'Income' ? '+' : '-'}₹
                {Number(item.amount).toLocaleString('en-IN')}
              </strong>

              <button
                type="button"
                onClick={() => restoreTransaction(item._id)}
              >
                Restore
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  ) : (
    <>
      <div className="filter-section">
        <label>Filter by category</label>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option>All</option>
          <option>Salary</option>
          <option>Food</option>
          <option>Shopping</option>
          <option>Rent</option>
          <option>Travel</option>
          <option>Education</option>
          <option>Other</option>
        </select>
      </div>

      {transactions.length === 0 ? (
        <p className="empty">
          No transactions yet. Add your first one!
        </p>
      ) : filteredTransactions.length === 0 ? (
        <p className="empty">
          No transactions found in this category.
        </p>
      ) : (
        filteredTransactions.map((item) => (
          <div className="transaction" key={item._id}>
            <div>
              <strong>{item.title}</strong>
              <p>{item.category} · {item.date}</p>
            </div>

            <div className="transaction-amount">
              <strong
                className={item.type === 'Income' ? 'positive' : 'negative'}
              >
                {item.type === 'Income' ? '+' : '-'}₹
                {Number(item.amount).toLocaleString('en-IN')}
              </strong>

              <button
                type="button"
                onClick={() => {
                  setTitle(item.title)
                  setAmount(String(item.amount))
                  setType(item.type)
                  setCategory(item.category)
                  setEditingId(item._id)
                }}
              >
                Edit
              </button>

              <button
                className="delete-button"
                type="button"
                onClick={() => deleteTransaction(item._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </>
  )}
</section>
</section>
      </main>
    </div>
  )
}

export default App