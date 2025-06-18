import express from 'express';
import nunjucks from 'nunjucks';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';

const app = express();

// body parser set
app.use(bodyParser.urlencoded({ extended: false })); // express 기본 모듈 사용
app.use(bodyParser.json());

// view engine set
app.set('view engine', 'html'); // main.html -> main(.html)

// nunjucks
nunjucks.configure('views', {
    watch: true, // html 파일이 수정될 경우, 다시 반영 후 렌더링
    express: app
})

// mongoose connect
mongoose.connect('mongodb://localhost:27017').then(() => console.log('연결 성공')).catch(e => console.error(e));

// mongoose set
const { Schema } = mongoose;

const WritingSchema = new Schema({
    title : String,
    contents : String,
    date : {
        type: Date,
        default: Date.now,
    }
})

const Writing = mongoose.model('Writing', WritingSchema);

// 날짜를 문자열로 변환하는 함수
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

// middleware
// main page GET
app.get('/', async (req, res) => {
    let writings = await Writing.find({}).sort({ date: -1 });  // 날짜 기준 내림차순 정렬
    writings = writings.map(writing => ({
        ...writing.toObject(),
        date: formatDate(writing.date)
    }));
    res.render('main', {list : writings });
});

app.get('/write', (req, res) => {
    res.render('write');
});

app.post('/write', async (req, res) => {
    // request 안에 있는 내용을 처리
    // request.body

    const title = req.body.title;
    const contents = req.body.contents;

    // mongodb에 저장
    const writing = new Writing({
        title: title,
        contents: contents
    })

    const result = await writing.save().then(() => {
        console.log("성공")
        res.render('detail', { 'detail': { title: title, contents: contents } });
    }).catch((err) => {
        console.error(err)
        res.render('write')
    })
});

app.get('/detail/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const detail = await Writing.findOne({ _id: id });
        if (detail) {
            const formattedDetail = {
                ...detail.toObject(),
                date: formatDate(detail.date)
            };
            res.render('detail', { detail: formattedDetail });
        } else {
            res.status(404).send('게시글을 찾을 수 없습니다.');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/edit/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const edit = await Writing.findOne({ _id: id });
        if (edit) {
            const formattedEdit = {
                ...edit.toObject(),
                date: formatDate(edit.date)
            };
            res.render('edit', { edit: formattedEdit });
        } else {
            res.status(404).send('게시글을 찾을 수 없습니다.');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/edit/:id', async (req, res) => {
    const id = req.params.id;
    const title = req.body.title;
    const contents = req.body.contents;

    try {
        const result = await Writing.findByIdAndUpdate(
            id,
            { title, contents },
            { new: true }
        );
        
        if (result) {
            const formattedDetail = {
                ...result.toObject(),
                date: formatDate(result.date)
            };
            res.redirect(`/detail/${id}`);
        } else {
            res.status(404).send('게시글을 찾을 수 없습니다.');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('수정 중 오류가 발생했습니다.');
    }
});

// 삭제 기능 추가
app.post('/delete/:id', async (req, res) => {
    const id = req.params.id;
    
    try {
        await Writing.deleteOne({ _id: id });
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('삭제 중 오류가 발생했습니다.');
    }
});

app.listen(3000, () => {
    console.log('Server is running');
});