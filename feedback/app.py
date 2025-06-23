from flask import Flask, render_template, request, redirect, session
import sqlite3
import os, math

app = Flask(__name__)

# --- DB Path ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'feedback.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            status TEXT DEFAULT NULL
        )
    ''')
    # Check if status column exists, if not add it
    c.execute("PRAGMA table_info(feedback)")
    columns = [column[1] for column in c.fetchall()]
    if 'status' not in columns:
        c.execute("ALTER TABLE feedback ADD COLUMN status TEXT DEFAULT NULL")
    conn.commit()
    conn.close()

init_db()

# --- Routes ---
@app.route('/')
def index():
    page = request.args.get('page', 1, type=int)  # get page number from URL query, default 1
    status_filter = request.args.get('status_filter', 'all')
    per_page = 5
    offset = (page - 1) * per_page

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Base query
    query = 'SELECT * FROM feedback'
    count_query = 'SELECT COUNT(*) FROM feedback'
    
    # Add filter conditions
    if status_filter != 'all':
        if status_filter == 'pending':
            query += ' WHERE status IS NULL'
            count_query += ' WHERE status IS NULL'
        else:
            status_value = status_filter.replace('-', ' ').title()
            query += ' WHERE status = ?'
            count_query += ' WHERE status = ?'

    # Add ordering and pagination
    query += ' ORDER BY id DESC LIMIT ? OFFSET ?'

    # Execute count query
    if status_filter != 'all':
        if status_filter == 'pending':
            c.execute(count_query)
        else:
            c.execute(count_query, (status_value,))
    else:
        c.execute(count_query)
    total_count = c.fetchone()[0]

    # Fetch the current page of feedbacks
    if status_filter != 'all':
        if status_filter == 'pending':
            c.execute(query, (per_page, offset))
        else:
            c.execute(query, (status_value, per_page, offset))
    else:
        c.execute(query, (per_page, offset))
    
    feedbacks = c.fetchall()
    conn.close()

    total_pages = math.ceil(total_count / per_page)

    return render_template('index.html', 
                         feedbacks=feedbacks, 
                         page=page, 
                         total_pages=total_pages)


@app.route('/add', methods=['GET', 'POST'])
def add_feedback():
    if request.method == 'POST':
        try:
            name = request.form['name']
            email = request.form['email']
            title = request.form['title']
            description = request.form['description']

            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute('INSERT INTO feedback (title, description, name, email, status) VALUES (?, ?, ?, ?, NULL)',
                      (title, description, name, email))
            conn.commit()
            conn.close()
            return redirect('/')
        except Exception as e:
            return f"<h2>Internal Server Error:</h2><p>{e}</p>", 500
    return render_template('add_feedback.html')


app.secret_key = 'your-secret-key'  # Required for session


@app.route('/admin-login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        if request.form['password'] == 'trainingadmin911':
            session['admin'] = True
            return redirect('/admin')
        else:
            return render_template('adminlogin.html', error="Invalid password")
    return render_template('adminlogin.html')

@app.route('/admin')
def admin_panel():
    if not session.get('admin'):
        return redirect('/admin-login')
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT * FROM feedback ORDER BY id DESC')
    feedbacks = c.fetchall()
    conn.close()
    return render_template('admin.html', feedbacks=feedbacks)

@app.route('/update_status/<int:feedback_id>', methods=['POST'])
def update_status(feedback_id):
    new_status = request.form['status']
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('UPDATE feedback SET status = ? WHERE id = ?', (new_status, feedback_id))
    conn.commit()
    conn.close()
    return redirect('/admin')

@app.route('/admin-logout')
def admin_logout():
    session.pop('admin', None)
    return redirect('/admin-login')


if __name__ == '__main__':
    app.run(debug=True)