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

// middleware
// main page GET
app.get('/', async (req, res) => {
    // const fileData = fs.readFileSync(filePath);
    // const writings = JSON.parse(fileData);

    let writings = await Writing.find({});

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
        res.render('detail', { detail });  // key와 변수명이 같으면 생략 가능
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/edit/:id', async (req, res) => {
    const id = req.params.id;

    const edit = await Writing.findOne({ _id: id }).then((result) => {
        res.render('detail', { 'edit': result })
    }).catch((err) => {
        console.error(err)
    })
})

app.post('/edit/:id', async (req, res) => {
    const id = req.params.id;
    const title = req.body.title;
    const contents = req.body.contents;

    const edit = await Writing.replaceOne({ _id: id }, { title: title, contents: contents }).then((result) => {
        console.log('update success')
        res.render('detail', { 'detail': { 'id': id, 'title': title, 'contents': contents } });
    }).catch((err) => {
        console.error(err)
    })
})

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