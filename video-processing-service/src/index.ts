import express from 'express'
import ffmpeg from 'fluent-ffmpeg'

const app = express()
app.use(express.json())

app.get('/process-vidoe', (req, res) => {
    // Get paht of the input video file from the request body
    const inputVideoPath = req.body.inputVideoPath
    const outputVideoPath = req.body.outputVideoPath

    if (!inputVideoPath || !outputVideoPath) {
        res.status(400).send('Input and output video paths are required')
    }

    ffmpeg(inputVideoPath)
        .outputOption('-vf', 'scale=-1:360') //360p
        .on('end', () => {
            return res
                .status(200)
                .send('Video processing finished successfully')
        })
        .on('error', (err) => {
            console.log('An error occurred: ' + err.message)
            res.status(500).send('Internal server error: ' + err.message)
        })
        .save(outputVideoPath)
})

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`)
})
