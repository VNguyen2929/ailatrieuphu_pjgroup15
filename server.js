const express = require('express');
const mysql = require('mysql2');
const cors = require('cors'); 
const app = express();

// Sửa lại dòng PORT này để Render không bị sập
const PORT = process.env.PORT || 3000;

app.use(cors()); 
app.use(express.json());

const db = mysql.createConnection({
    host: 'b4dj0ftgiazi4ilxgnv8-mysql.services.clever-cloud.com',
    user: 'u9u9boxplpfnvcrj',
    password: '5NqvnDsAXFgxzQEI1PoU',
    database: 'b4dj0ftgiazi4ilxgnv8',
    port: 3306
});

db.connect(err => {
    if (err) {
        console.error('❌ LỖI KẾT NỐI DATABASE:', err.stack);
        return;
    }
    console.log('✅ DATABASE CLEVER-CLOUD ĐÃ SẴN SÀNG');
});

// ===================================
// API CHỦ ĐỀ VÀ BÀI HỌC
// ===================================
app.get('/api/topics', (req, res) => {
    const sql = 'SELECT id, name FROM topics ORDER BY id';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Lỗi lấy Chủ đề.' });
        res.json(results);
    });
});

app.post('/api/topics', (req, res) => {
    const { name } = req.body;
    const sql = 'INSERT INTO topics (name) VALUES (?)';
    db.query(sql, [name], (err, result) => {
        if (err) return res.status(500).json({ message: 'Lỗi khi thêm chủ đề.' });
        res.json({ message: 'Thêm chủ đề thành công!', id: result.insertId });
    });
});

app.put('/api/topics/:id', (req, res) => {
    const { name } = req.body;
    const sql = 'UPDATE topics SET name = ? WHERE id = ?';
    db.query(sql, [name, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Lỗi khi đổi tên chủ đề.' });
        res.json({ message: 'Đổi tên chủ đề thành công!' });
    });
});

app.delete('/api/topics/:id', (req, res) => {
    const sql = 'DELETE FROM topics WHERE id = ?';
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Không thể xóa! Vui lòng xóa hết các Bài học trong Chủ đề này trước.' });
        res.json({ message: 'Xóa chủ đề thành công!' });
    });
});

app.get('/api/lessons/:topicId', (req, res) => {
    const sql = 'SELECT id, name, is_summary FROM lessons WHERE topic_id = ? ORDER BY is_summary, id';
    db.query(sql, [req.params.topicId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Lỗi lấy Bài học.' });
        res.json(results);
    });
});

app.post('/api/lessons', (req, res) => {
    const { topic_id, name, is_summary } = req.body;
    const sql = 'INSERT INTO lessons (topic_id, name, is_summary) VALUES (?, ?, ?)';
    db.query(sql, [topic_id, name, is_summary || 0], (err, result) => {
        if (err) return res.status(500).json({ message: 'Lỗi khi thêm bài học.' });
        res.json({ message: 'Thêm bài học thành công!', id: result.insertId });
    });
});

app.put('/api/lessons/:id', (req, res) => {
    const { name } = req.body;
    const sql = 'UPDATE lessons SET name = ? WHERE id = ?';
    db.query(sql, [name, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Lỗi đổi tên.' });
        res.json({ message: 'Đổi tên bài học thành công!' });
    });
});

app.delete('/api/lessons/:id', (req, res) => {
    const sql = 'DELETE FROM lessons WHERE id = ?';
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Không thể xóa! Cần xóa hết câu hỏi trước.' });
        res.json({ message: 'Xóa bài học thành công!' });
    });
});

// ===================================
// API CÂU HỎI VÀ GAME LÝ THUYẾT
// ===================================
app.get('/api/questions/:lessonId', (req, res) => {
    const sql = 'SELECT * FROM questions WHERE lesson_id = ? ORDER BY id DESC';
    db.query(sql, [req.params.lessonId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Lỗi lấy danh sách câu hỏi.' });
        const formattedResults = results.map(q => ({
            ...q,
            options: typeof q.options_json === 'string' ? JSON.parse(q.options_json) : q.options_json
        }));
        res.json(formattedResults);
    });
});

app.post('/api/questions', (req, res) => {
    const { lesson_id, question_text, options, correct_answer, difficulty } = req.body;
    const options_json = JSON.stringify(options);
    const final_difficulty = difficulty ? difficulty.toLowerCase() : 'medium';
    const sql = `INSERT INTO questions (lesson_id, question_text, options_json, correct_answer, difficulty) VALUES (?, ?, ?, ?, ?)`;
    db.query(sql, [lesson_id, question_text, options_json, correct_answer, final_difficulty], (err, result) => {
        if (err) return res.status(500).json({ message: 'Lỗi thêm câu hỏi', error: err.message });
        res.json({ message: 'Thêm thành công!', id: result.insertId });
    });
});

app.delete('/api/questions/:id', (req, res) => {
    db.query('DELETE FROM questions WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Lỗi xóa.' });
        res.json({ message: 'Xóa thành công!' });
    });
});

app.put('/api/questions/:id', (req, res) => {
    const { question_text, options, correct_answer, difficulty } = req.body;
    const options_json = JSON.stringify(options);
    const sql = `UPDATE questions SET question_text = ?, options_json = ?, correct_answer = ?, difficulty = ? WHERE id = ?`;
    db.query(sql, [question_text, options_json, correct_answer, difficulty, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Lỗi khi cập nhật câu hỏi.' });
        res.json({ message: 'Cập nhật thành công!' });
    });
});

app.get('/api/questions/quiz/:lessonId', (req, res) => {
    const sql = 'SELECT * FROM questions WHERE lesson_id = ?';
    db.query(sql, [req.params.lessonId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Lỗi Database.' });

        const easy = results.filter(q => q.difficulty.toLowerCase() === 'easy');
        const medium = results.filter(q => q.difficulty.toLowerCase() === 'medium');
        const hard = results.filter(q => q.difficulty.toLowerCase() === 'hard');

        if (easy.length < 4 || medium.length < 3 || hard.length < 3 || results.length < 11) {
            return res.status(400).json({
                message: `Không đủ câu hỏi! Cần ít nhất 4 dễ (có ${easy.length}), 3 TB (có ${medium.length}), 3 khó (có ${hard.length}) và tổng cộng > 10 câu để có dự phòng.`
            });
        }

        const shuffle = (array) => array.sort(() => Math.random() - 0.5);
        const finalQuizRaw = [...shuffle(easy).slice(0, 4), ...shuffle(medium).slice(0, 3), ...shuffle(hard).slice(0, 3)];
        const usedIds = finalQuizRaw.map(q => q.id);
        const remainingQuestions = results.filter(q => !usedIds.includes(q.id));
        const backupRaw = shuffle(remainingQuestions)[0];

        const formatQuestion = (q) => ({
            ...q,
            options: typeof q.options_json === 'string' ? JSON.parse(q.options_json) : q.options_json
        });

        res.json({
            quiz: finalQuizRaw.map(formatQuestion),
            backup: formatQuestion(backupRaw)
        });
    });
});

// ===================================
// API LỚP HỌC (ĐÃ BỔ SUNG SỬA/XÓA)
// ===================================
app.get('/api/classes', (req, res) => {
    const sql = `
        SELECT c.*, t.full_name as teacher_name 
        FROM classes c 
        LEFT JOIN teachers t ON c.teacher_id = t.id 
        ORDER BY c.class_name`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Lỗi lấy danh sách Lớp.' });
        res.json(results);
    });
});

app.get('/api/classes/teacher/:teacherId', (req, res) => {
    const sql = 'SELECT * FROM classes WHERE teacher_id = ? ORDER BY class_name';
    db.query(sql, [req.params.teacherId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Lỗi lấy danh sách Lớp của GV.' });
        res.json(results);
    });
});

app.post('/api/classes', (req, res) => {
    const { class_name, teacher_id } = req.body;
    db.query('INSERT INTO classes (class_name, teacher_id) VALUES (?, ?)', [class_name, teacher_id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Lỗi thêm lớp (có thể bị trùng tên).' });
        res.json({ message: 'Thêm lớp thành công!', id: result.insertId });
    });
});

app.put('/api/classes/:id', (req, res) => {
    const { class_name } = req.body;
    const sql = 'UPDATE classes SET class_name = ? WHERE id = ?';
    db.query(sql, [class_name, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Lỗi khi đổi tên lớp.' });
        res.json({ message: 'Đổi tên Lớp thành công!' });
    });
});

app.delete('/api/classes/:id', (req, res) => {
    const sql = 'DELETE FROM classes WHERE id = ?';
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Không thể xóa! Vui lòng xóa hết học sinh trong Lớp này trước.' });
        res.json({ message: 'Xóa Lớp thành công!' });
    });
});

// ===================================
// API HỌC SINH
// ===================================
app.get('/api/students/:classId', (req, res) => {
    const sql = 'SELECT * FROM students WHERE class_id = ? ORDER BY student_number';
    db.query(sql, [req.params.classId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Lỗi lấy danh sách Học sinh.' });
        res.json(results);
    });
});

app.post('/api/students', (req, res) => {
    const { class_id, student_number, full_name, password } = req.body;
    const sql = 'INSERT INTO students (class_id, student_number, full_name, password) VALUES (?, ?, ?, ?)';
    db.query(sql, [class_id, student_number, full_name, password], (err, result) => {
        if (err) return res.status(500).json({ message: 'Lỗi thêm học sinh.' });
        res.json({ message: 'Thêm học sinh thành công!' });
    });
});

app.put('/api/students/:id', (req, res) => {
    const { student_number, full_name, password } = req.body;
    const sql = 'UPDATE students SET student_number = ?, full_name = ?, password = ? WHERE id = ?';
    db.query(sql, [student_number, full_name, password, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Lỗi cập nhật. Có thể do STT bị trùng!' });
        res.json({ message: 'Cập nhật học sinh thành công!' });
    });
});

app.delete('/api/students/:id', (req, res) => {
    db.query('DELETE FROM students WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Lỗi khi xóa học sinh.' });
        res.json({ message: 'Xóa học sinh thành công!' });
    });
});

app.post('/api/students/bulk', (req, res) => {
    const { class_id, students } = req.body;
    if (!students || students.length === 0) return res.status(400).json({ message: 'Không có dữ liệu học sinh.' });
    const values = students.map(st => [class_id, st.student_number, st.full_name, st.password]);
    const sql = 'INSERT INTO students (class_id, student_number, full_name, password) VALUES ?';
    db.query(sql, [values], (err, result) => {
        if (err) return res.status(500).json({ message: 'Lỗi khi thêm danh sách. Có thể do bị trùng Số thứ tự (STT).' });
        res.json({ message: `Đã thêm thành công ${result.affectedRows} học sinh vào lớp!` });
    });
});

app.post('/api/students/login', (req, res) => {
    const { class_id, student_number, password } = req.body;
    const sql = 'SELECT * FROM students WHERE class_id = ? AND student_number = ? AND password = ?';
    db.query(sql, [class_id, student_number, password], (err, results) => {
        if (err) return res.status(500).json({ message: 'Lỗi server.' });
        if (results.length > 0) res.json({ message: 'Đăng nhập thành công!', student: results[0] });
        else res.status(401).json({ message: 'Sai Lớp, STT hoặc Mật khẩu!' });
    });
});

app.put('/api/student-change-password', (req, res) => {
    const { student_id, old_password, new_password } = req.body;
    db.query('SELECT * FROM students WHERE id = ? AND password = ?', [student_id, old_password], (err, results) => {
        if (err) return res.status(500).json({ message: 'Lỗi server khi kiểm tra mật khẩu.' });
        if (results.length === 0) return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác!' });
        db.query('UPDATE students SET password = ? WHERE id = ?', [new_password, student_id], (err, result) => {
            if (err) return res.status(500).json({ message: 'Lỗi khi cập nhật mật khẩu mới.' });
            res.json({ message: 'Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới nhé.' });
        });
    });
});

// ===================================
// API KẾT QUẢ
// ===================================
app.post('/api/results', (req, res) => {
    const { student_id, lesson_id, play_mode, correct_answers, score } = req.body;
    const sql = 'INSERT INTO gameresults (student_id, lesson_id, play_mode, correct_answers, score) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [student_id || null, lesson_id, play_mode, correct_answers, score], (err, result) => {
        if (err) return res.status(500).json({ message: 'Lỗi lưu kết quả.', error: err.message });
        res.json({ message: 'Kết quả đã được ghi nhận vào Bảng Vàng!' });
    });
});

app.get('/api/results/all', (req, res) => {
    const sql = `
        SELECT r.id, r.play_time, r.play_mode, r.correct_answers, r.score, 
               s.full_name, s.student_number, c.class_name, l.name as lesson_name 
        FROM gameresults r
        LEFT JOIN students s ON r.student_id = s.id
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN lessons l ON r.lesson_id = l.id
        ORDER BY r.play_time DESC`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Lỗi lấy kết quả.' });
        res.json(results);
    });
});

app.get('/api/results/teacher/:teacherId', (req, res) => {
    const sql = `
        SELECT r.id, r.play_time, r.play_mode, r.correct_answers, r.score, 
               s.full_name, s.student_number, c.class_name, l.name as lesson_name
        FROM gameresults r
        LEFT JOIN students s ON r.student_id = s.id
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN lessons l ON r.lesson_id = l.id
        WHERE c.teacher_id = ?
        ORDER BY r.play_time DESC
    `;
    db.query(sql, [req.params.teacherId], (err, results) => {
        if (err) return res.status(500).json({ message: "Lỗi lấy dữ liệu kết quả!" });
        res.json(results);
    });
});

app.delete('/api/results/bulk-delete', (req, res) => {
    const { ids } = req.body;
    if (!ids || ids.length === 0) return res.status(400).json({ message: 'Không có dữ liệu để xóa.' });
    db.query('DELETE FROM gameresults WHERE id IN (?)', [ids], (err, result) => {
        if (err) return res.status(500).json({ message: 'Lỗi Database khi xóa kết quả.' });
        res.json({ message: `Đã xóa thành công ${result.affectedRows} kết quả!` });
    });
});

app.delete('/api/results/clear', (req, res) => {
    db.query('DELETE FROM gameresults', (err, result) => {
        if (err) return res.status(500).json({ message: 'Lỗi khi xóa.' });
        res.json({ message: 'Đã xóa sạch bảng điểm!' });
    });
});

// ===================================
// API GIÁO VIÊN (ĐÃ ĐƯỢC KHÔI PHỤC)
// ===================================
app.post('/api/teachers/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT id, username, full_name FROM teachers WHERE username = ? AND password = ?', [username, password], (err, results) => {
        if (err) return res.status(500).json({ message: 'Lỗi server.' });
        if (results.length > 0) res.json({ teacher: results[0] });
        else res.status(401).json({ message: 'Sai Tên đăng nhập hoặc Mật khẩu!' });
    });
});

app.post('/api/teachers', (req, res) => {
    const { username, password, full_name } = req.body;
    db.query('SELECT * FROM teachers WHERE username = ?', [username], (err, results) => {
        if (err) return res.status(500).json({ message: 'Lỗi Database.' });
        if (results.length > 0) return res.status(400).json({ message: 'Tên đăng nhập này đã tồn tại!' });

        db.query('INSERT INTO teachers (username, password, full_name) VALUES (?, ?, ?)', [username, password, full_name], (err, result) => {
            if (err) return res.status(500).json({ message: 'Lỗi khi tạo tài khoản.' });
            res.json({ message: 'Đã cấp tài khoản Giáo viên thành công!' });
        });
    });
});

app.get('/api/teachers', (req, res) => {
    db.query('SELECT id, username, full_name FROM teachers ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).json({ message: 'Lỗi lấy danh sách Giáo viên.' });
        res.json(results);
    });
});

app.delete('/api/teachers/:id', (req, res) => {
    db.query('DELETE FROM teachers WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Lỗi khi xóa tài khoản giáo viên.' });
        res.json({ message: 'Xóa tài khoản giáo viên thành công!' });
    });
});

app.put('/api/teachers/admin-edit/:id', (req, res) => {
    const { username, full_name, password } = req.body;
    if (password && password.trim() !== '') {
        db.query('UPDATE teachers SET username = ?, full_name = ?, password = ? WHERE id = ?', [username, full_name, password, req.params.id], (err, result) => {
            if (err) return res.status(500).json({ message: 'Lỗi cập nhật. Tên đăng nhập có thể trùng.' });
            res.json({ message: 'Đã cập nhật thông tin và mật khẩu mới cho Giáo viên!' });
        });
    } else {
        db.query('UPDATE teachers SET username = ?, full_name = ? WHERE id = ?', [username, full_name, req.params.id], (err, result) => {
            if (err) return res.status(500).json({ message: 'Lỗi cập nhật. Tên đăng nhập có thể trùng.' });
            res.json({ message: 'Đã cập nhật thông tin Giáo viên!' });
        });
    }
});

app.put('/api/teacher-update-profile', (req, res) => {
    const { teacher_id, username, full_name } = req.body;
    db.query('SELECT * FROM teachers WHERE username = ? AND id != ?', [username, teacher_id], (err, results) => {
         if (err) return res.status(500).json({ message: 'Lỗi kiểm tra.' });
         if (results.length > 0) return res.status(400).json({ message: 'Tên đăng nhập này đã có người sử dụng!' });
         db.query('UPDATE teachers SET username = ?, full_name = ? WHERE id = ?', [username, full_name, teacher_id], (err, result) => {
             if (err) return res.status(500).json({message: 'Lỗi cập nhật.'});
             res.json({message: 'Cập nhật thông tin cá nhân thành công!'});
         });
    });
});

app.put('/api/teacher-change-password', (req, res) => {
    const { teacher_id, old_password, new_password } = req.body;
    db.query('SELECT * FROM teachers WHERE id = ? AND password = ?', [teacher_id, old_password], (err, results) => {
        if (err) return res.status(500).json({ message: 'Lỗi máy chủ khi kiểm tra.' });
        if (results.length === 0) return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác!' });
        db.query('UPDATE teachers SET password = ? WHERE id = ?', [new_password, teacher_id], (err, result) => {
            if (err) return res.status(500).json({ message: 'Lỗi khi đổi mật khẩu mới.' });
            res.json({ message: 'Đổi mật khẩu thành công! Lần sau hãy đăng nhập bằng mật khẩu mới nhé.' });
        });
    });
});

// KHỞI ĐỘNG SERVER
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại cổng ${PORT}`);
});
